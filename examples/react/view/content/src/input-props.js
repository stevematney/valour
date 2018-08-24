import PropTypes from 'prop-types';

export default {
  name: PropTypes.string,
  id: PropTypes.string,
  labelValue: PropTypes.string.isRequired,
  valid: PropTypes.bool,
  formName: PropTypes.string.isRequired,
  required: PropTypes.bool,
  addValueFunc: PropTypes.func.isRequired,
  onFoucsLost: PropTypes.func,
  shouldFocus: PropTypes.bool
};
