import React, { PropTypes } from 'react';

import IssueInfo from 'components/IssueInfo';

import './IssueStatus.scss';


const IssueStatus = React.createClass({

  displayName: 'IssueStatus',

  propTypes: {
    issue: IssueInfo.PropTypes.issue.isRequired,
    dependencies: PropTypes.arrayOf(IssueInfo.PropTypes.issue),
    displayDepedencies: PropTypes.bool.isRequired,
  },

  render() {
    let {issue, dependencies, displayDepedencies} = this.props;

    return (
      <div className="IssueStatus">
        <div className="IssueStatus-issue">
          {this._renderIssueInfo(issue.id)}
        </div>
        {displayDepedencies && dependencies.length > 0 &&
          <div className="IssueStatus-dependencies">
            <h2 className="IssueStatus-dependenciesTitle">
              Dependencies
            </h2>
            <div className="IssueStatus-dependenciesList">
              {dependencies.map(this._renderIssueInfo)}
            </div>
          </div>
        }
      </div>
    );
  },

  _renderIssueInfo(issue) {
    return (
      <IssueInfo
        key={issue.id}
        issue={issue}
      />
    );
  },

});

export default IssueStatus;
