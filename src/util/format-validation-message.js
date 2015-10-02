export default function formatValidationMessage(message, values) {
  return Object.keys(values).reduce((mess, key) => {
    return mess.replace(`{${key}}`, values[key]);
  }, message);
}
