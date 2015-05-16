import Marty from 'marty';
import Immutable from 'immutable';
import _ from 'lodash';

import { fetchIssue } from 'mock/GithubApi';
import { ISSUE_WARNINGS, ISSUE_LABELS, DEPENDENCY_PATTERN } from 'constants/IssueConstants';


class IssueStore extends Marty.Store {

  constructor(options) {
    super(options);
    this.state = Immutable.Map();
    this.handlers = {};
  }

  /**
   * @param  {user, project, id} id
   * @return {IssueData}
   */
  getIssue(id) {
    return this.fetch({
      id: id,
      locally() {
        console.log('get locally ' + id);
        return this.state.get(id);
      },
      remotely() {
        console.log('get remotely ' + id);
        return fetchIssue(id)
          .then(computeIssueFromApiResponse)
          .then((issue) => ({...issue, id}))
          .then(this._computeIssueDependencies)
          .then((issue) => this.state = this.state.set(id, issue));
      },
    });
  }

  getDependentsIdDeep(issueId) {
    let issue = this.getIssue(issueId);
    return _.uniq(_.flatten(_.map(issue.dependentsId, (dependentId) => {
      return [dependentId].concat(this.getDependentsIdDeep(dependentId));
    })));
  }

  getDependenciesIdDeep(issueId) {
    let issue = this.getIssue(issueId);
    return _.uniq(_.flatten(_.map(issue.dependenciesId, (dependencyId) => {
      return [dependencyId].concat(this.getDependenciesIdDeep(dependencyId));
    })));
  }

  _computeIssueDependencies(issue) {
    let dependenciesId = extractIssueDependenciesId(issue);
    _.each(dependenciesId, (id) => this._addIssueDependency(id, issue.id));
    return issue;
  }

  _addIssueDependency(issueId, newDependencyId) {
    //Check if equal
    if (newDependencyId === issueId) {
      return { warnings: [ISSUE_WARNINGS.DEPENDENCIES_ITSELF] };
    }

    let dependencyIssue = this.getIssue(newDependencyId);

    let dependentsIdDeep = this.getDependentsIdDeep(issueId),
        includedInDeepDependents = _.contains(dependentsIdDeep, newDependencyId);

    if (includedInDeepDependents) {
      return { warnings: [ISSUE_WARNINGS.DEPENDENCIES_CYCLIC(newDependencyId)] };
    }

    let dependenciesId = dependencyIssue ? dependencyIssue.dependencies : [],
        includedInDependencies = _.contains(dependenciesId, newDependencyId);

    if (!includedInDependencies) {
      //Add newDependencyId to issueId's dependencies
      this.state = this.state.updateIn([issueId, 'dependenciesId'], val => val.push(newDependencyId));
      //Add issueId to newDependencyId's dependents
      this.state = this.state.updateIn([newDependencyId, 'dependentsId'], val => val.push(issueId));

      this.hasChanged();
    }
  }

}


function computeIssueFromApiResponse(response) {
  let labels = mapLabels(response.labels),
      statuses = _.pluck(labels, 'status'),
      lowerStatus = getLowestStatusStep(statuses),
      warnings = [];

  return {
    href: response.href,
    title: response.title,
    dateStart: response.dateStart,
    comments: response.comments,
    labels,
    statuses,
    status: lowerStatus,
    warnings,
  };
}

/**
 * Map label names to ISSUE_LABELS.
 * Remove not supported label names
 * @param  {Array<String>} labels
 * @return {Array<ISSUE_LABEL>} ISSUE_LABEL: {name: Integer, status: ISSUE_STATUS}
 */
function mapLabels(labels) {
  let mappedLabels = _.map(labels, (label) => _.find(ISSUE_LABELS, {label: label}));
  return _.compact(mappedLabels);
}

function getLowestStatusStep(statuses) {
  return _.sortBy(statuses, (status) => status.step)[0];
}

function extractIssueDependenciesId(issue) {
  return _.compact(_.map(issue.comments, (comment) => {
    let matches = comment.match(DEPENDENCY_PATTERN);
    return matches && {
      user: matches[1],
      project: matches[2],
      id: matches[3],
    };
  }));
}

export default Marty.register(IssueStore);
