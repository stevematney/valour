import React from 'react';
import valour from 'valour';

export default class ValidatedForm extends React.Component{
  static propTypes = {
    name: React.PropTypes.string.isRequired,
    children: React.PropTypes.node
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
