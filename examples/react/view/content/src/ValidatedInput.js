import React from 'react';
import classNames from 'classnames';
import props from './input-props';
import valour from 'valour';

export default class ValidatedInput extends React.Component {
  static propTypes = {
    ...props,
    getSanitizedValue: React.PropTypes.func,
    getValidation: React.PropTypes.func
  }

  static defaultProps = {
    getSanitizedValue: val => val,
    getValidation: () => valour.rule
  }

  constructor() {
    super();
    this.state = {};
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(ev) {
    let validationObj = {};
    validationObj[this.props.name] = ev.target.value;
    valour.runValidation(this.props.formName, validationObj);
  }

  render() {
    let {name, id, labelValue, required} = this.props;
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
        <input type='text' className='form-control' name={name} id={id} onChange={this.handleChange} />
        <br />
      </div>
    );
  }

  setRequired(name, existingConfig) {
    if (!this.props.required) {
      return existingConfig;
    }
    return existingConfig.isRequired();
  }

  componentDidMount() {
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
}
