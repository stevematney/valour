import React from 'react';

export default class ValidatedForm extends React.Component{
  render() {
    return (
      <form>
        {this.props.children}
      </form>
    );
  }
}
