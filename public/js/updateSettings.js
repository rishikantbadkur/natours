/* eslint-disable */
import { showAlert } from './alert';
import axios from 'axios';

export const updateSettings = async function (data, type) {
  try {
    const url =
      type === 'Password'
        ? 'api/v1/users/updateMyPassword'
        : 'api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type} Updated successfully`);
    }
  } catch (error) {
    showAlert('error', error.response.data.message);
  }
};
