import Spinner from "./Spinner.jsx";

const InlineSpinner = ({ w = 16, h, ...props }) => <Spinner size={h || w} {...props} />;

export default InlineSpinner;
