import React from 'react';
import valour from 'valour';
import PropTypes from 'prop-types';

export default class ValidatedForm extends React.Component{
  static propTypes = {
    name: PropTypes.string.isRequired,
    children: PropTypes.node
  }

  constructor() {
    super();
    this.state = {
      valid: null
    };
  }

  render() {
    return (
      <form {...this.props}>
        {this.props.children}
        <fieldset disabled={!this.state.valid}>
          <input type='button' value='Submit' className='btn btn-primary' />
        </fieldset>
      </form>
    );
  }

  componentDidMount() {
    let {name} = this.props;
    valour.onUpdated(name, () => {
      this.setState({
        valid: valour.isValid(name)
      });
    });
  }
}
