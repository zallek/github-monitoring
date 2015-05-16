import React, {PropTypes} from 'react';

import IssueStatusController from 'controllers/IssueStatusController';


let IssueStatusHandler = React.createClass({

  displayName: 'IssueStatusHandler',

  propTypes: {
    params: PropTypes.shape({
      id: PropTypes.string.isRequired,
    }).isRequired,
  },

  render() {
    let id = this.props.params.id;
    return (
      <IssueStatusController
        issueId={{
          id: id,
          user: 'user',
          project: 'project',
        }}
        displayDepedencies={true}
      />
    );
  },

});

export default IssueStatusHandler;
