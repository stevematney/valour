import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';

export default class RequiredInput extends React.Component {
  static propTypes = inputProps;
  constructor() {
    super();
    this.state = {};
  }
  render() {
    return <ValidatedInput {...this.props} valid={this.state.valid} />;
  }

  componentDidMount() {
    let formValidation = {};
    formValidation[this.props.name] = valour.rule.isRequired();
    valour.update(this.props.formName, formValidation, (result) => {
      this.setState({
        valid: result[this.props.name].valid
      });
    });
  }
}
