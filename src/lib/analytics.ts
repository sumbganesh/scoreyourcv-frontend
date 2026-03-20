import mixpanel from "mixpanel-browser";

type EventProperties = Record<string, unknown>;

const mixpanelToken = import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined;
const mixpanelApiHost =
	(import.meta.env.VITE_MIXPANEL_API_HOST as string | undefined) ??
	"https://api-eu.mixpanel.com";
let isInitialized = false;

const sanitizeProperties = (properties: EventProperties = {}) =>
	Object.fromEntries(
		Object.entries(properties).filter(
			([, value]) => value !== undefined && value !== null,
		),
	);

export const initAnalytics = () => {
	if (isInitialized || !mixpanelToken) {
		return;
	}
	mixpanel.init(mixpanelToken, {
		debug: import.meta.env.DEV,
		persistence: "localStorage",
		autocapture: false,
		track_pageview: true,
		record_sessions_percent: 100,
		api_host: mixpanelApiHost,
	});
	mixpanel.register({
		app_name: "hire-right-frontend",
		app_env: import.meta.env.MODE,
	});
	isInitialized = true;
};

export const trackEvent = (
	eventName: string,
	properties: EventProperties = {},
) => {
	if (!isInitialized) {
		initAnalytics();
	}
	if (!isInitialized) {
		return;
	}
	mixpanel.track(eventName, sanitizeProperties(properties));
};

export const getDistinctId = () => {
	if (!isInitialized) {
		initAnalytics();
	}
	if (!isInitialized) {
		return undefined;
	}
	return mixpanel.get_distinct_id();
};
