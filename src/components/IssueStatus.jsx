import React from 'react';
import { PropTypes, addons } from 'react/addons';
const { update } = addons;
import _ from 'lodash';

import * as GithubApi from 'mock/github';
import IssueInfoRow from 'components/IssueInfoRow';
import { ISSUE_WARNINGS, ISSUE_LABELS, DEPENDENCY_PATTERN } from 'constants/issue';

import './IssueStatus.scss';

const GithubPropTypes = {
  repository: PropTypes.shape({
    user: PropTypes.string.isRequired,
    project: PropTypes.string.isRequired,
  }),
  issue: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
};

const IssueStatus = React.createClass({

  displayName: 'IssueStatus',

  propTypes: {
    repository: GithubPropTypes.repository.isRequired,
    issue: GithubPropTypes.issue.isRequired,
    displayDepedencies: PropTypes.bool,
  },

  getDefaultPropTypes() {
    return {
      displayDepedencies: false
    };
  },

  getInitialState() {
    return {
      topIssueId: this.props.issue.id,
      issuesList: {},
    };
  },

  _extractDependencies(issueComments) {
    return _.compact(_.map(issueComments, (comment) => {
      let matches = comment.match(DEPENDENCY_PATTERN);
      return matches && matches[1];
    }));
  },

  _computeDependenciesStatus(issueId) {
    let issuesList = this.state.issuesList,
        issue = issuesList[issueId],
        dependenciesIdDeep = this._getDependenciesIdDeep(issueId);

    let dependenciesStatus = _.map(dependenciesIdDeep, (id) => issuesList[id].status);
    dependenciesStatus = _.compact(dependenciesStatus); //Some dependencies might have no status
    dependenciesStatus = this._getLowestStatusStep(dependenciesStatus);

    this.setState(update(this.state, {
      issuesList: {
        [issueId]: {
          dependenciesStatus: {
            $set: dependenciesStatus,
          }
        }
      }
    }));

    _.each(issue.dependentsId, this._computeDependenciesStatus);
  },

  _getLowestStatusStep(statuses) {
    return _.sortBy(statuses, (status) => status.step)[0];
  },

  _computeWarnings(issueId) {

  },

  _addIssue({id, ...othersProps}) {
    this.setState(update(this.state, {
      issuesList: {
        $merge: {
          [id]: {
            id: id,
            dependenciesId: [],
            dependentsId: [],
            warnings: [],
            fetched: false,
            ...othersProps,
          }
        }
      }
    }));
  },

  _updateIssue({id, ...othersProps}) {
    this.setState(update(this.state, {
      issuesList: {
        [id]: {
          $merge: {
            ...othersProps,
          }
        }
      }
    }));
  },

  _getDependentsIdDeep(issueId) {
    let issueLists = this.state.issuesList;
    return _.uniq(_.flatten(_.map(issueLists[issueId].dependentsId, (dependentId) => {
      return [dependentId].concat(this._getDependentsIdDeep(dependentId));
    })));
  },

  _getDependenciesIdDeep(issueId) {
    let issueLists = this.state.issuesList;
    return _.uniq(_.flatten(_.map(issueLists[issueId].dependenciesId, (dependencyId) => {
      return [dependencyId].concat(this._getDependenciesIdDeep(dependencyId));
    })));
  },

  _fetchIssue(issueId) {
    let {
      repository: { user, project },
    } = this.props;

    GithubApi.getIssueInfo({user, project, issueId}, (response) => {
      let dependenciesId = this._extractDependencies(response.comments);

      let labels = _.uniq(_.filter(ISSUE_LABELS, ({status}, label) => _.contains(response.labels, label)));
      let status = this._getLowestStatusStep(_.pluck(labels, 'status'));
      let warnings = [];

      this._updateIssue({
        id: issueId,
        href: response.href,
        title: response.title,
        dateStart: response.dateStart,
        status: status,
        fetched: true,
      });

      _.each(dependenciesId, (dependencyId) => {
        //Check if equal
        if (dependencyId === issueId) {
          warnings.push(ISSUE_WARNINGS.DEPENDENCIES_ITSELF);
          return;
        }

        let dependencyIssue = this.state.issuesList[dependencyId];
        //Add if not exist
        if (!dependencyIssue) {
          this._addIssue({
            id: dependencyId,
          });
          this._fetchIssue(dependencyId);
        }

        let dependentsIdDeep = this._getDependentsIdDeep(issueId),
            includedInDeepDependents = _.contains(dependentsIdDeep, dependencyId),
            dependenciesId = dependencyIssue ? dependencyIssue.dependencies : [],
            includedInDependencies = _.contains(dependenciesId, dependencyId);

        if (includedInDeepDependents) {
          warnings.push(ISSUE_WARNINGS.DEPENDENCIES_CYCLIC(dependencyId));
          return;
        }
        else if (!includedInDependencies) {
          //Add dependencyId to issueId's dependencies
          this.setState(update(this.state, {
            issuesList: {
              [issueId]: {
                dependenciesId: {
                  $push: [dependencyId],
                }
              }
            }
          }));
          //Add issueId to dependencyId's dependents
          this.setState(update(this.state, {
            issuesList: {
              [dependencyId]: {
                dependentsId: {
                  $push: [issueId],
                }
              }
            }
          }));
        }
      });

      let dependenciesStatus = this._computeDependenciesStatus(issueId);
      this._updateIssue({
        id: issueId,
        dependenciesStatus: dependenciesStatus,
      });

      warnings.concat(this._computeWarnings(issueId));
      this.setState(update(this.state, {
        issuesList: {
          [issueId]: {
            warnings: {
              $push: warnings,
            }
          }
        }
      }));
    });
  },

  componentWillMount() {
    let {topIssueId} = this.state;
    this._addIssue({id: topIssueId});
    this._fetchIssue(topIssueId);
  },

  render() {
    let {topIssueId} = this.state,
        {displayDepedencies} = this.props,
        dependenciesId = this._getDependenciesIdDeep(topIssueId);

    return (
      <div className="IssueStatus">
        <div className="IssueStatus-issue">
          {this._renderIssueInfo(topIssueId)}
        </div>
        {displayDepedencies && dependenciesId.length > 0 &&
          <div className="IssueStatus-dependencies">
            <h2 className="IssueStatus-dependenciesTitle">
              Dependencies
            </h2>
            <div className="IssueStatus-dependenciesList">
              {dependenciesId.map(this._renderIssueInfo)}
            </div>
          </div>
        }
      </div>
    );
  },

  _renderIssueInfo(issueId) {
    let issueState = this.state.issuesList[issueId];
    return (
      <IssueInfoRow key={issueState.id} {...issueState}/>
    );
  },

});

export default IssueStatus;
export {GithubPropTypes};
