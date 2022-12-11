/* es-lint disable */

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};
export const showAlert = function (type, msg) {
  //Before showing alert make sure to hide all existing alerts.
  hideAlert();
  const markup = `<div class='alert alert--${type}'>${msg}</div`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  // hide alert after 5 sec
  window.setTimeout(hideAlert, 5000);
};
