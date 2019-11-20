/*
 * Copyright (c) 2019-present Sonatype, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Uri, window } from "vscode";

import { ComponentEntry, PolicyViolation } from "./ComponentInfoPanel";
import { ComponentContainer } from "./packages/ComponentContainer";
import { RequestService } from "./RequestService";
import { IqRequestService } from "./IqRequestService";

export class IqComponentModel {
    components: Array<ComponentEntry> = [];
    coordsToComponent: Map<string, ComponentEntry> = new Map<
      string,
      ComponentEntry
    >();
    requestService: RequestService;
  
    constructor(
      readonly url: string,
      private user: string,
      private password: string,
      private applicationPublicId: string,
      private getmaximumEvaluationPollAttempts: number
    ) {
      this.requestService = new IqRequestService(this.url, this.user, this.password, this.getmaximumEvaluationPollAttempts);
    }
  
    public getContent(resource: Uri): Thenable<string> {
      return new Promise((c, e) => "my stubbed content entry");
    }
  
    public async evaluateComponents() {
      console.debug("evaluateComponents");
      await this.performIqScan();
    }
  
    private async performIqScan() {
      try {
        let componentContainer = new ComponentContainer(this.requestService);

        let data: any;

        if (componentContainer.PackageMuncher != undefined) {
          await componentContainer.PackageMuncher.packageForIq();
  
          data = await componentContainer.PackageMuncher.convertToNexusFormat();
          this.components = componentContainer.PackageMuncher.toComponentEntries(data);
          this.coordsToComponent = componentContainer.PackageMuncher.CoordinatesToComponents;
        } else {
          throw new TypeError("Unable to instantiate Package Muncher");
        }

        if (undefined == data) {
          throw new RangeError("Attempted to generated dependency list but received an empty collection. NexusIQ will not be invoked for this project.");
        }
  
        console.debug("getting applicationInternalId", this.applicationPublicId);
        let response: string = await this.requestService.getApplicationId(this.applicationPublicId) as string;
  
        let appRep = JSON.parse(response);
        console.debug("appRep", appRep);
  
        this.requestService.setApplicationId(appRep.applications[0].id)
        console.debug("applicationInternalId", this.requestService.getApplicationInternalId());
  
        let resultId = await this.requestService.submitToIqForEvaluation(data, this.requestService.getApplicationInternalId());
  
        console.debug("report", resultId);
        let resultDataString = await this.requestService.asyncPollForEvaluationResults(this.requestService.getApplicationInternalId(), resultId);
        let resultData = JSON.parse(resultDataString as string);
  
        console.debug(`Received results from IQ scan:`, resultData);

        for (let resultEntry of resultData.results) {
          let componentEntry: ComponentEntry | undefined;

          componentEntry = this.coordsToComponent.get(
            componentContainer.PackageMuncher.ConvertToComponentEntry(resultEntry)
          );
        
          componentEntry!.policyViolations = resultEntry.policyData.policyViolations as Array<PolicyViolation>;
          componentEntry!.hash = resultEntry.component.hash;
          componentEntry!.nexusIQData = resultEntry;
        }
      } catch (e) {
        window.showErrorMessage("Nexus IQ extension: " + e);
        return;
      }
  }
}