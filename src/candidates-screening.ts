import { mount } from "svelte";
import "./app.css";
import Screening from "./Screening.svelte";

const app = mount(Screening, {
	target: document.getElementById("app")!,
});

export default app;
