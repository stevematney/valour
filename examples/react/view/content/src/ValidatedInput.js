import React from 'react';
import classNames from 'classnames';
import props from './input-props';
import valour from 'valour';

export default class ValidatedInput extends React.Component {
  static propTypes = {
    ...props,
    type: React.PropTypes.string,
    getSanitizedValue: React.PropTypes.func
  }

  static defaultProps = {
    getSanitizedValue: val => val,
    getValidation: () => valour.rule,
    onChange: () => {},
    type: 'text'
  }

  constructor() {
    super();
    this.state = {};
    this.handleChange = this.handleChange.bind(this);
  }

  setRequired(name, existingConfig) {
    if (!this.props.required) {
      return existingConfig;
    }
    return existingConfig.isRequired();
  }

  addValueFunc() {
    this.props.addValueFunc(() => {
      let values = {};
      values[this.props.name] = this.currentValue && this.props.getSanitizedValue(this.currentValue);
      return values;
    });
  }

  addValidation() {
    let formValidation = {};
    let { name } = this.props;
    formValidation[name] = this.props.getValidation();
    formValidation[name] = this.setRequired(name, formValidation[name]);
    valour.update(this.props.formName, formValidation, (result) => {
      this.setState({
        valid: result[this.props.name].valid
      });
    });
  }

  handleChange(ev) {
    this.currentValue = ev.target.value;
    this.props.onChange();
  }

  render() {
    let {name, id, labelValue, required, onChange, type} = this.props;
    let {valid} = this.state;
    id = id || name;
    let containerClasses = classNames('form-group', {
      'has-error': valid === false,
      'has-success': valid === true
    });
    return (
      <div className={containerClasses}>
        <br />
        <label htmlFor={id}>
          { labelValue }{ required ? '*' : '' }
        </label>
        <input type={ type } className='form-control' ref='input' name={name} id={id} onChange={this.handleChange} onBlur={this.handleChange} />
        <br />
      </div>
    );
  }

  componentDidMount() {
    this.addValidation();
    this.addValueFunc();
  }
}
