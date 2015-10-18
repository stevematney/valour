import React from 'react';
import classNames from 'classnames';
import props from './input-props';
import valour from 'valour';

export default class ValidatedInput extends React.Component {
  static propTypes = props;

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
    let {name, id, labelValue, valid} = this.props;
    id = id || name;
    let containerClasses = classNames('form-group', {
      'has-error': valid === false,
      'has-success': valid === true
    });
    return (
      <div className={containerClasses}>
        <br />
        <label htmlFor={id}>
          { labelValue }
        </label>
        <input type='text' className='form-control' name={name} id={id} onChange={this.handleChange} />
        <br />
      </div>
    );
  }
}
