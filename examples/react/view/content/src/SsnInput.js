import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';

export default class SsnInput extends React.Component {
  static propTypes = inputProps;
  constructor() {
    super();
    this.state = {};
  }

  getSanitizedValue(val) {
    return val.trim();
  }

  getValidation() {
    return valour.rule.matches(/^\d{3}-?\d{2}-?\d{4}$/);
  }

  render() {
    const {getValidation, getSanitizedValue} = this;
    let props = {...this.props, getValidation, getSanitizedValue};
    return <ValidatedInput { ...props } getValidation={this.getValidation} />;
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
