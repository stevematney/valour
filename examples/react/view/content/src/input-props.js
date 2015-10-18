import { PropTypes as props } from 'react';

export default {
  name: props.string,
  id: props.string,
  labelValue: props.string.isRequired,
  valid: props.bool,
  formName: props.string.isRequired,
  required: props.bool
};
