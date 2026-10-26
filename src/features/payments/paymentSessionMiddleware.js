import paymentApi from "../../services/api/user/paymentApi.js";

export const paymentSessionMiddleware = ({ getState, dispatch }) => (next) => (action) => {
  const previous = getState().user?.user;
  const result = next(action);
  if (action.type === "user/setUser") {
    const current = getState().user?.user;
    if (previous?._id !== current?._id || previous?.role !== current?.role) {
      dispatch(paymentApi.util.getRunningQueriesThunk()).forEach((request) => request.abort());
      dispatch(paymentApi.util.getRunningMutationsThunk()).forEach((request) => request.abort());
      dispatch(paymentApi.util.resetApiState());
    }
  }
  return result;
};
