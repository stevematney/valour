import React from 'react';

export default class ValidatedInput extends React.Component {
  render() {
    let {name, id, labelValue} = this.props;
    id = id || name;
    return (
      <div className='form-group'>
        <br />
        <label htmlFor={id}>
          { labelValue }
        </label>
        <input type='text' className='form-control' name={name} id={id}/>
        <br />
      </div>
    );
  }
}
