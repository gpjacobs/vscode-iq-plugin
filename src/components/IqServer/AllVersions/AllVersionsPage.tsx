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
import * as React from 'react';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import { VersionsContextConsumer } from '../../../context/versions-context';
import ClassNameUtils from '../../../utils/ClassNameUtils';
import SelectedBadge from './SelectedBadge/SelectedBadge';

type Props = {
  versionChangeHandler: (version: string) => void
};

type State = {
  selectedVersion: string
};

class AllVersionsPage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      selectedVersion: ""
    }
  }

  private handleClick(e: any) {
    console.debug("row clicked, event:", e);
    this.setState({selectedVersion: e});
    this.props.versionChangeHandler(e);
  }

  public render() {
    var _this = this;

    return (
      <VersionsContextConsumer>
        {context => (
          <React.Fragment>
            {Object.keys(context!.allVersions).map(row => (
              <Alert 
                  className={_this.getAlertClassname(context, row)}
                  onClick={_this.handleClick.bind(_this, context!.allVersions[row].componentIdentifier.coordinates.version)}>
                <SelectedBadge 
                  version={context!.allVersions[row].componentIdentifier.coordinates.version} 
                  selectedVersion={context!.selectedVersion} 
                  initialVersion={context!.initialVersion} /> { context!.allVersions[row].componentIdentifier.coordinates.version }
                <Badge 
                  className={ClassNameUtils.threatClassName(context!.allVersions[row].highestSecurityVulnerabilitySeverity)}>
                    CVSS: {context!.allVersions[row].highestSecurityVulnerabilitySeverity}
                </Badge>
              </Alert>
            ))}
          </React.Fragment>
        )}
      </VersionsContextConsumer>
    );
  }

  public componentDidMount() {
    this.scrollToCurrentVersion()
  }

  public componentDidUpdate() {
    console.debug("AllVersionsPage updated");
    this.scrollToCurrentVersion()
  }

  private scrollToCurrentVersion() {
    let selectedElement = document.getElementsByClassName("current-version");
    console.debug("found current version", selectedElement);
    if (selectedElement && selectedElement.length > 0) {
      console.debug("scrolling into view ", selectedElement[0]);
      selectedElement[0].scrollIntoView();
    }
  }

  private getAlertClassname(context: any, row: any): string {
    var className: string = ""
    if (context!.allVersions[row].componentIdentifier.coordinates.version == context!.selectedVersion) {
      className += " selected-version";
    }
    if (context!.allVersions[row].componentIdentifier.coordinates.version == context!.initialVersion) {
      className += " current-version";
    }
    return className
  }
}

export default AllVersionsPage;