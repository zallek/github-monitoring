import React, { PropTypes } from 'react';
import Marty from 'marty';
import _ from 'lodash';

import IssueStatus from 'components/IssueStatus';
import IssueStore from 'stores/IssueStore';


const _PropTypes = {
  issueId: PropTypes.shape({
    user: PropTypes.string.isRequired,
    project: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }),
};

const IssueStatusController = React.createClass({

  displayName: 'IssueStatusController',

  propTypes: {
    issueId: _PropTypes.issueId.isRequired,
    displayDepedencies: PropTypes.bool,
  },

  getIssue(id) {
    return IssueStore.getIssue(id).when({
      pending: () => ({id, pending: true}),
      done: (fetch) => fetch.result,
    });
  },

  render() {
    let {issueId, displayDepedencies} = this.props;

    let issue = this.getIssue(issueId),
        dependenciesId = IssueStore.getDependenciesIdDeep(issueId),
        dependencies = _.map(dependenciesId, this.getIssue);

    return (
      <IssueStatus
        issue={issue}
        dependencies={dependencies}
        displayDepedencies={displayDepedencies}
      />
    );
  },

});

export default Marty.createContainer(IssueStatusController, {
  listenTo: IssueStore,
});
