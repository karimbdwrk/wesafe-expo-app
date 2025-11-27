import JobsList from "../components/JobsList";

const LastMinuteScreen = () => {
	return <JobsList pageNbr={1} itemsPerPage={5} isLastMinute={true} />;
};

export default LastMinuteScreen;
