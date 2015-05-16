import React, {PropTypes} from 'react';

import IssueStatus from 'components/IssueStatus';


let IssueStatusHandler = React.createClass({

  displayName: 'IssueStatusHandler',

  propTypes: {
    params: PropTypes.shape({
      id: PropTypes.number.isRequired,
    }).isRequired,
  },

  render() {
    let id = this.props.params.id;
    return (
      <IssueStatus
        issue={{
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
