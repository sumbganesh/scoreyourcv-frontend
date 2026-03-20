<script lang="ts">
	import "./app.css";
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Separator } from "$lib/components/ui/separator";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Switch } from "$lib/components/ui/switch";
	import { onMount } from "svelte";
	import { getDistinctId, initAnalytics, trackEvent } from "$lib/analytics";

	type ScoringMode = "jobDescription" | "roleProfile";

	let stage = $state<"form" | "processing" | "results">("form");
	let resumeFiles = $state<FileList | undefined>(undefined);
	let useRoleProfileMode = $state(false);
	let resultMode = $state<ScoringMode>("jobDescription");
	let jobTitle = $state("");
	let jobDescription = $state("");
	let jobProfile = $state("");
	let submitError = $state("");
	let aiResult = $state<unknown>(null);
	const aiPayload = $derived.by(() => {
		if (typeof aiResult === "string") {
			try {
				return JSON.parse(aiResult) as Record<string, unknown>;
			} catch {
				return null;
			}
		}
		if (aiResult && typeof aiResult === "object") {
			return aiResult as Record<string, unknown>;
		}
		return null;
	});
	const aiSummary = $derived<{
		totalScore?: number;
		scoreOutOf?: number;
		passLikelihoodPercent?: number;
		estimatedScoreAfterTop3?: number;
		confidenceNote?: string;
		scoreSummary?: string;
		passLikelihoodSummary?: string;
		resultsSummary?: string;
	} | null>(
		typeof aiPayload?.summary === "object" && aiPayload?.summary
			? (aiPayload.summary as {
					totalScore?: number;
					scoreOutOf?: number;
					passLikelihoodPercent?: number;
					estimatedScoreAfterTop3?: number;
					confidenceNote?: string;
					scoreSummary?: string;
					passLikelihoodSummary?: string;
					resultsSummary?: string;
				})
			: null,
	);
	const aiGateChecks = $derived<
		Array<{
			gate?: string;
			status?: string;
			issue?: string;
			fix?: string;
		}>
	>(
		Array.isArray(aiPayload?.gateChecks)
			? (aiPayload?.gateChecks as Array<{
					gate?: string;
					status?: string;
					issue?: string;
					fix?: string;
				}>)
			: [],
	);
	const aiPillarScores = $derived<
		Array<{
			pillar?: string;
			weight?: number;
			score?: number;
			weightedScore?: number;
		}>
	>(
		Array.isArray(aiPayload?.pillarScores)
			? (aiPayload?.pillarScores as Array<{
					pillar?: string;
					weight?: number;
					score?: number;
					weightedScore?: number;
				}>)
			: [],
	);
	const aiProfileMatch = $derived<{
		score?: number;
		scoreOutOf?: number;
		summary?: string;
		topGaps?: string[];
		suggestions?: string[];
	} | null>(
		typeof aiPayload?.profileMatch === "object" && aiPayload?.profileMatch
			? (aiPayload?.profileMatch as {
					score?: number;
					scoreOutOf?: number;
					summary?: string;
					topGaps?: string[];
					suggestions?: string[];
				})
			: null,
	);
	const aiMissingKeywords = $derived<{
		required?: string[];
		preferred?: string[];
	}>(
		typeof aiPayload?.missingKeywords === "object" &&
			aiPayload?.missingKeywords
			? (aiPayload?.missingKeywords as {
					required?: string[];
					preferred?: string[];
				})
			: {},
	);
	const aiImprovements = $derived<
		Array<{
			priority?: string;
			pillar?: string;
			estimatedImpact?: number;
			issue?: string;
			fix?: string;
			example?: string;
		}>
	>(
		Array.isArray(aiPayload?.improvements)
			? (aiPayload?.improvements as Array<{
					priority?: string;
					pillar?: string;
					estimatedImpact?: number;
					issue?: string;
					fix?: string;
					example?: string;
				}>)
			: [],
	);
	const aiCopyPaste = $derived<Array<{ type?: string; text?: string }>>(
		Array.isArray(aiPayload?.copyPaste)
			? (aiPayload?.copyPaste as Array<{ type?: string; text?: string }>)
			: [],
	);
	const aiCopyPasteNote = $derived(
		typeof aiPayload?.copyPasteNote === "string"
			? (aiPayload?.copyPasteNote as string)
			: "",
	);
	const aiFitSignals = $derived<{
		strengths?: string[];
		risks?: string[];
	} | null>(
		typeof aiPayload?.fitSignals === "object" && aiPayload?.fitSignals
			? (aiPayload.fitSignals as {
					strengths?: string[];
					risks?: string[];
				})
			: null,
	);
	const aiRecommendation = $derived<{
		label?: string;
		reason?: string;
	} | null>(
		typeof aiPayload?.recommendation === "object" &&
			aiPayload?.recommendation
			? (aiPayload.recommendation as { label?: string; reason?: string })
			: null,
	);
	const scoringMode = $derived<ScoringMode>(
		useRoleProfileMode ? "roleProfile" : "jobDescription",
	);
	const resumeFile = $derived<File | null>(resumeFiles?.[0] ?? null);
	const resumeName = $derived(resumeFile?.name ?? "");
	const isRoleProfileMode = () => useRoleProfileMode;
	const isRoleProfileResult = () => resultMode === "roleProfile";
	const normalizeScoringMode = (value: unknown): ScoringMode =>
		value === "roleProfile" ? "roleProfile" : "jobDescription";
	const getPassLabel = (value: number) => {
		if (value >= 85) return "Strong pass";
		if (value >= 70) return "Likely";
		if (value >= 55) return "Borderline";
		return "Unlikely";
	};
	const getGateVariant = (status?: string) => {
		const normalized = status?.toLowerCase();
		if (normalized === "pass") return "secondary";
		if (normalized === "fail") return "destructive";
		return "outline";
	};
	const getScoreTone = (value: number) => {
		if (value >= 85) return "text-emerald-600";
		if (value >= 70) return "text-sky-600";
		if (value >= 55) return "text-amber-600";
		return "text-rose-600";
	};
	const extractFileExtension = (fileName: string) => {
		const parts = fileName.split(".");
		if (parts.length < 2) {
			return "unknown";
		}
		return parts[parts.length - 1].toLowerCase();
	};
	const getWordCount = (value: string) => {
		const trimmed = value.trim();
		if (!trimmed) {
			return 0;
		}
		return trimmed.split(/\s+/).length;
	};
	const getSubmissionInputMetrics = (
		selectedMode: ScoringMode,
		descriptionInput: string,
		profileInput: string,
	) => {
		const selectedResume = resumeFile;
		const activeInput =
			selectedMode === "roleProfile" ? profileInput : descriptionInput;
		return {
			scoring_mode: selectedMode,
			resume_present: Boolean(selectedResume),
			resume_extension: selectedResume
				? extractFileExtension(selectedResume.name)
				: undefined,
			resume_size_kb: selectedResume
				? Math.round(selectedResume.size / 1024)
				: undefined,
			jd_char_count: descriptionInput.length,
			jd_word_count: getWordCount(descriptionInput),
			role_profile_char_count: profileInput.length,
			role_profile_word_count: getWordCount(profileInput),
			active_input_char_count: activeInput.length,
			active_input_word_count: getWordCount(activeInput),
		};
	};
	const asTrackingNumber = (value: unknown) =>
		typeof value === "number" && Number.isFinite(value) ? value : undefined;
	const getTrackingMetricsFromAi = (aiData: unknown) => {
		if (!aiData || typeof aiData !== "object") {
			return {
				total_score: undefined,
				pass_likelihood_percent: undefined,
				profile_match_score: undefined,
				gate_fail_count: undefined,
				missing_required_count: undefined,
				improvement_count: undefined,
				recommendation_label: undefined,
			};
		}
		const payload = aiData as Record<string, unknown>;
		const summary =
			typeof payload.summary === "object" && payload.summary
				? (payload.summary as Record<string, unknown>)
				: null;
		const profileMatch =
			typeof payload.profileMatch === "object" && payload.profileMatch
				? (payload.profileMatch as Record<string, unknown>)
				: null;
		const recommendation =
			typeof payload.recommendation === "object" && payload.recommendation
				? (payload.recommendation as Record<string, unknown>)
				: null;
		const gateFailCount = Array.isArray(payload.gateChecks)
			? payload.gateChecks.filter((entry) => {
					if (!entry || typeof entry !== "object") {
						return false;
					}
					const status = (entry as Record<string, unknown>).status;
					return (
						typeof status === "string" &&
						status.toLowerCase() === "fail"
					);
				}).length
			: undefined;
		const missingRequiredCount =
			typeof payload.missingKeywords === "object" &&
			payload.missingKeywords &&
			Array.isArray(
				(payload.missingKeywords as Record<string, unknown>).required,
			)
				? (
						(payload.missingKeywords as Record<string, unknown>)
							.required as unknown[]
					).length
				: undefined;
		const improvementCount = Array.isArray(payload.improvements)
			? payload.improvements.length
			: undefined;
		const recommendationLabel =
			typeof recommendation?.label === "string"
				? recommendation.label
				: undefined;
		return {
			total_score: asTrackingNumber(summary?.totalScore),
			pass_likelihood_percent: asTrackingNumber(
				summary?.passLikelihoodPercent,
			),
			profile_match_score: asTrackingNumber(profileMatch?.score),
			gate_fail_count: gateFailCount,
			missing_required_count: missingRequiredCount,
			improvement_count: improvementCount,
			recommendation_label: recommendationLabel,
		};
	};
	const limitWords = (text: string, maxWords = 18) => {
		const words = text.trim().split(/\s+/);
		if (words.length <= maxWords) return text;
		return `${words.slice(0, maxWords).join(" ")}…`;
	};
	const metricSummaryWordLimit = 12;
	const summarizeFirstItem = (
		items: string[] | undefined,
		fallback: string,
	) => {
		if (items && items.length > 0) {
			return limitWords(items[0], metricSummaryWordLimit);
		}
		return fallback;
	};
	const profileCardSummary = $derived(
		aiProfileMatch?.summary
			? limitWords(aiProfileMatch.summary, metricSummaryWordLimit)
			: "Profile match summary not available.",
	);
	const recommendationCardSummary = $derived(
		aiRecommendation?.reason
			? limitWords(aiRecommendation.reason, metricSummaryWordLimit)
			: "Recommendation reason not available.",
	);
	const topGapsCardSummary = $derived(
		summarizeFirstItem(
			aiProfileMatch?.topGaps,
			"No role-profile gaps returned.",
		),
	);
	const suggestionsCardSummary = $derived(
		summarizeFirstItem(
			aiProfileMatch?.suggestions,
			"No role-profile suggestions returned.",
		),
	);

	const backendUrl =
		import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";
	let hasTrackedInitialMode = false;
	let lastTrackedResumeName = "";

	onMount(() => {
		initAnalytics();
		trackEvent("screening_page_viewed", {
			page: "screening",
			distinct_id: getDistinctId(),
		});
	});

	$effect(() => {
		const currentMode = scoringMode;
		if (!hasTrackedInitialMode) {
			hasTrackedInitialMode = true;
			return;
		}
		trackEvent("screening_mode_toggled", {
			scoring_mode: currentMode,
		});
	});

	$effect(() => {
		const selectedResume = resumeFile;
		if (!selectedResume) {
			return;
		}
		if (selectedResume.name === lastTrackedResumeName) {
			return;
		}
		lastTrackedResumeName = selectedResume.name;
		trackEvent("resume_file_selected", {
			file_extension: extractFileExtension(selectedResume.name),
			file_size_kb: Math.round(selectedResume.size / 1024),
		});
	});

	const results = {
		score: 86,
		passLikelihood: 82,
		breakdown: {
			"JD relevance": 88,
			"Keyword coverage": 82,
			"Experience alignment": 84,
			"ATS formatting": 92,
			"Clarity & impact": 74,
		},
		gateChecks: {
			Format: "Pass",
			Layout: "Pass",
			Graphics: "Pass",
			Headings: "Pass",
			"File size": "Pass",
		},
		missingRequired: [
			"Lifecycle marketing",
			"Retention analytics",
			"User segmentation",
		],
		missingPreferred: ["A/B testing", "Experiment design", "CRM tooling"],
		improvements: [
			{
				title: "Priority: High · +8 points",
				body: "Add missing keywords to your summary and latest role.",
				helper: "Add: “lifecycle marketing, retention analytics, user segmentation”.",
			},
			{
				title: "Priority: Medium · +5 points",
				body: "Convert passive bullets into action verbs with metrics.",
				helper: "Example: “Increased trial-to-paid conversion by 18%”.",
			},
		],
		copyPaste: [
			"Product marketer with GTM leadership in B2B SaaS, lifecycle messaging, retention analytics, and user segmentation.",
			"Led lifecycle campaigns that improved retention by 14% through cohort-based segmentation and CRM automation.",
		],
	};

	const handleSubmit = async () => {
		if (stage === "processing") {
			return;
		}
		const requestStartTime = performance.now();
		submitError = "";
		aiResult = null;
		const trimmedDescription = jobDescription.trim();
		const trimmedProfile = jobProfile.trim();
		const selectedMode = scoringMode;
		const selectedInput =
			selectedMode === "roleProfile"
				? trimmedProfile
				: trimmedDescription;
		const submissionInputMetrics = getSubmissionInputMetrics(
			selectedMode,
			trimmedDescription,
			trimmedProfile,
		);
		trackEvent("screening_submit_clicked", {
			has_resume: Boolean(resumeFile),
			has_job_title: Boolean(jobTitle.trim()),
			input_length: selectedInput.length,
			...submissionInputMetrics,
		});
		if (!selectedInput) {
			submitError =
				selectedMode === "roleProfile"
					? "Add a role profile."
					: "Add a job description.";
			trackEvent("screening_submit_blocked", {
				reason:
					selectedMode === "roleProfile"
						? "role_profile_missing"
						: "job_description_missing",
				...submissionInputMetrics,
			});
			return;
		}
		resultMode = selectedMode;
		stage = "processing";
		const formData = new FormData();
		if (resumeFile) {
			formData.append("resume", resumeFile);
		}
		if (jobTitle.trim()) {
			formData.append("jobTitle", jobTitle);
		}
		formData.append("scoringMode", selectedMode);
		if (selectedMode === "jobDescription") {
			formData.append("jobDescription", trimmedDescription);
		}
		if (selectedMode === "roleProfile") {
			formData.append("jobProfile", trimmedProfile);
		}

		try {
			const response = await fetch(`${backendUrl}/api/screening`, {
				method: "POST",
				body: formData,
			});
			const payload = await response.json().catch(() => null);
			if (!response.ok) {
				stage = "form";
				submitError =
					payload?.error?.message ?? "Unable to submit the form.";
				trackEvent("screening_submit_failed", {
					status_code: response.status,
					error_code: payload?.error?.code ?? "UNKNOWN",
					duration_ms: Math.round(
						performance.now() - requestStartTime,
					),
					...submissionInputMetrics,
				});
				return;
			}
			const responseMode = normalizeScoringMode(
				payload?.data?.received?.scoringMode,
			);
			resultMode = responseMode;
			aiResult = payload?.data?.ai ?? null;
			const trackingMetrics = getTrackingMetricsFromAi(payload?.data?.ai);
			const durationMs = Math.round(performance.now() - requestStartTime);
			trackEvent("screening_submit_succeeded", {
				duration_ms: durationMs,
				...submissionInputMetrics,
				scoring_mode: responseMode,
				...trackingMetrics,
			});
			trackEvent("screening_results_viewed", {
				duration_ms: durationMs,
				...submissionInputMetrics,
				scoring_mode: responseMode,
				...trackingMetrics,
			});
			await new Promise((resolve) => setTimeout(resolve, 400));
			stage = "results";
		} catch {
			stage = "form";
			submitError = "Unable to submit the form.";
			trackEvent("screening_submit_failed", {
				error_code: "NETWORK_OR_RUNTIME",
				duration_ms: Math.round(performance.now() - requestStartTime),
				...submissionInputMetrics,
			});
		}
	};

	const resetForm = () => {
		trackEvent("screening_reset_clicked", {
			previous_stage: stage,
			result_mode: resultMode,
		});
		stage = "form";
		aiResult = null;
	};

	const downloadReport = () => {
		const trackingMetrics = getTrackingMetricsFromAi(aiResult);
		trackEvent("screening_report_downloaded", {
			scoring_mode: resultMode,
			...trackingMetrics,
		});
		const summary = aiSummary ?? {
			totalScore: results.score,
			scoreOutOf: 100,
			passLikelihoodPercent: results.passLikelihood,
			estimatedScoreAfterTop3: results.score,
			confidenceNote: "",
		};
		const gateChecks =
			aiGateChecks.length > 0
				? aiGateChecks
				: Object.entries(results.gateChecks).map(([gate, status]) => ({
						gate,
						status,
						issue: "",
						fix: "",
					}));
		const pillarScores =
			aiPillarScores.length > 0
				? aiPillarScores
				: Object.entries(results.breakdown).map(([pillar, score]) => ({
						pillar,
						score,
						weight: undefined,
					}));
		const missingRequired =
			aiMissingKeywords.required ?? results.missingRequired;
		const missingPreferred =
			aiMissingKeywords.preferred ?? results.missingPreferred;
		const improvements =
			aiImprovements.length > 0
				? aiImprovements
				: results.improvements.map((item) => ({
						priority: item.title,
						pillar: "",
						estimatedImpact: 0,
						issue: item.body,
						fix: item.helper,
						example: "",
					}));
		const profileMatch = aiProfileMatch ?? {
			score: 0,
			scoreOutOf: 100,
			summary: "",
			topGaps: [],
			suggestions: [],
		};
		const profileStrengths = aiFitSignals?.strengths ?? [];
		const profileRisks = aiFitSignals?.risks ?? [];
		const recommendationLabel = aiRecommendation?.label ?? "";
		const recommendationReason = aiRecommendation?.reason ?? "";
		const report = isRoleProfileResult()
			? `Score Your CV Role Profile Report

Role: ${jobTitle || "Role not specified"}
Resume: ${resumeName || "Resume uploaded"}

Profile match score: ${profileMatch.score ?? 0} / ${
					profileMatch.scoreOutOf ?? 100
				}
Profile match summary: ${profileMatch.summary ?? ""}
Recommendation: ${recommendationLabel}
Reason: ${recommendationReason}

Top gaps:
${(profileMatch.topGaps ?? []).map((item) => `- ${item}`).join("\n")}

Suggestions:
${(profileMatch.suggestions ?? []).map((item) => `- ${item}`).join("\n")}

Strength signals:
${profileStrengths.map((item) => `- ${item}`).join("\n")}

Risk signals:
${profileRisks.map((item) => `- ${item}`).join("\n")}
`
			: `Score Your CV ATS Report

Role: ${jobTitle || "Role not specified"}
Resume: ${resumeName || "Resume uploaded"}

Total ATS score: ${summary.totalScore ?? 0} / ${summary.scoreOutOf ?? 100}
Pass likelihood: ${summary.passLikelihoodPercent ?? 0}%
Estimated score after top 3: ${summary.estimatedScoreAfterTop3 ?? 0}
Confidence note: ${summary.confidenceNote ?? ""}
Profile match score: ${aiProfileMatch?.score ?? 0} / ${
					aiProfileMatch?.scoreOutOf ?? 100
				}
Profile match summary: ${aiProfileMatch?.summary ?? ""}

Score breakdown:
${pillarScores
	.map(
		(item) =>
			`- ${item.pillar ?? "Pillar"}: ${item.score ?? 0} (weight ${
				item.weight ?? "n/a"
			})`,
	)
	.join("\n")}

Gate checks:
${gateChecks
	.map((item) => `- ${item.gate ?? "Gate"}: ${item.status ?? "unknown"}`)
	.join("\n")}

Missing required keywords:
${missingRequired.map((item) => `- ${item}`).join("\n")}

Missing preferred keywords:
${missingPreferred.map((item) => `- ${item}`).join("\n")}

Top improvements:
${improvements
	.map(
		(item) =>
			`- ${item.priority ?? "Priority"}: ${item.issue ?? ""} ${
				item.fix ? `(${item.fix})` : ""
			}`,
	)
	.join("\n")}
`;
		const blob = new Blob([report], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement("a");
		anchor.href = url;
		anchor.download = "Score-Your-CV-Report.txt";
		anchor.click();
		URL.revokeObjectURL(url);
	};
</script>

<svelte:head>
	<title>Score Your CV — ATS Scoring Workspace</title>
</svelte:head>

<div class="min-h-screen bg-muted/30 text-foreground">
	<header class="border-b bg-background/80">
		<div
			class="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6"
		>
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-18 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-semibold"
				>
					SYCV
				</div>
				<div class="space-y-0.5">
					<div class="text-md font-bold uppercase tracking-[0.2em]">
						Score Your CV
					</div>
					<div class="text-xs font-semibold text-muted-foreground">
						ATS Resume Scoring
					</div>
				</div>
			</div>
			<div class="flex flex-wrap items-center gap-3">
				<Button variant="outline" size="sm" href="/"
					>Back to landing</Button
				>
				<Button size="sm" href="/candidates/screening/"
					>Start a new score</Button
				>
			</div>
		</div>
	</header>

	<main class="mx-auto w-full max-w-6xl space-y-8 px-6 py-8">
		<section class="flex flex-wrap items-center justify-between gap-4">
			<div class="space-y-2">
				<p
					class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
				>
					{isRoleProfileMode() ? "Role profile match" : "ATS scoring"}
				</p>
				<h1 class="text-3xl font-semibold">
					Score your CV against a role
				</h1>
				<p class="text-sm text-muted-foreground">
					Choose one mode, score once, and keep JD scoring and role
					profile match separate.
				</p>
			</div>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="secondary">PDF/DOCX · up to 10MB</Badge>
				<Badge variant="secondary">Downloadable report</Badge>
				<Badge variant="secondary">Single scan delivery</Badge>
			</div>
		</section>

		{#if stage === "form"}
			<section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
				<Card>
					<CardHeader class="space-y-2">
						<CardTitle>Upload and score</CardTitle>
						<CardDescription>
							Use the toggle to select one input mode and submit
							only that context.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form
							class="space-y-6"
							onsubmit={(event) => {
								event.preventDefault();
								handleSubmit();
							}}
						>
							<div class="grid gap-4 md:grid-cols-2">
								<div class="space-y-2">
									<Label for="resume"
										>Resume file (PDF/DOCX)</Label
									>
									<Input
										id="resume"
										type="file"
										accept=".pdf,.docx"
										bind:files={resumeFiles}
									/>
									{#if resumeName}
										<p
											class="text-xs text-muted-foreground"
										>
											Selected: {resumeName}
										</p>
									{/if}
								</div>
								<div class="space-y-2">
									<Label for="job-title"
										>Target role title</Label
									>
									<Input
										id="job-title"
										type="text"
										placeholder="e.g. Senior Product Analyst"
										bind:value={jobTitle}
									/>
								</div>
							</div>
							<div
								class="space-y-3 rounded-lg border border-border/60 p-3"
							>
								<div
									class="flex flex-wrap items-center justify-between gap-3"
								>
									<p
										class="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground"
									>
										Scoring mode
									</p>
									<Switch
										bind:checked={useRoleProfileMode}
										aria-label="Toggle scoring mode"
										title="Toggle scoring mode"
									/>
								</div>
								<p class="text-xs text-muted-foreground">
									{isRoleProfileMode()
										? "Scoring you Resume agains Role Profile"
										: "Scoring you Resume agains Job Description"}
								</p>
							</div>
							<div class="space-y-2">
								{#key scoringMode}
									{#if isRoleProfileMode()}
										<Label for="profile-input"
											>Role profile</Label
										>
										<Textarea
											id="profile-input"
											rows={6}
											placeholder="Describe responsibilities, seniority, and must-have skills"
											bind:value={jobProfile}
										/>
									{:else}
										<Label for="jd-input"
											>Job description</Label
										>
										<Textarea
											id="jd-input"
											rows={6}
											placeholder="Paste the JD here"
											bind:value={jobDescription}
										/>
									{/if}
								{/key}
							</div>
							<div class="flex items-end">
								<div class="w-full space-y-2">
									<Button
										size="lg"
										class="w-full"
										type="submit"
									>
										{isRoleProfileMode()
											? "Generate role profile match"
											: "Generate ATS score"}
									</Button>
									{#if submitError}
										<p class="text-xs text-destructive">
											{submitError}
										</p>
									{/if}
									<p class="text-xs text-muted-foreground">
										Downloadable report · Single scan, no
										subscription
									</p>
								</div>
							</div>
							<div
								class="flex flex-wrap gap-2 text-xs text-muted-foreground"
							>
								{#if isRoleProfileMode()}
									<span
										>Role-fit scoring from profile context</span
									>
									<span>•</span>
									<span>Strength and risk signal output</span>
									<span>•</span>
									<span>Gap-focused improvement guidance</span
									>
									<span>•</span>
									<span>Downloadable report included</span>
								{:else}
									<span>Gate checks run before scoring</span>
									<span>•</span>
									<span>Weighted ATS rubric</span>
									<span>•</span>
									<span
										>Copy-ready fixes when clarity is high</span
									>
									<span>•</span>
									<span>Downloadable report included</span>
								{/if}
							</div>
						</form>
					</CardContent>
				</Card>

				<div class="space-y-6">
					<Card>
						<CardHeader class="space-y-2">
							<CardTitle>What you receive</CardTitle>
							<CardDescription>
								Selected mode:
								{isRoleProfileMode()
									? " Role Profile Match"
									: " Job Description ATS Score"}
							</CardDescription>
						</CardHeader>
						<CardContent
							class="space-y-3 text-sm text-muted-foreground"
						>
							{#if isRoleProfileMode()}
								<div class="flex items-center justify-between">
									<span>Scoring basis</span>
									<Badge variant="secondary">
										Role profile input
									</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Profile match score</span>
									<Badge variant="outline">/ 100</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Top gaps</span>
									<Badge variant="outline">5 max</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Recommendations</span>
									<Badge variant="outline">Targeted</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Fit signals</span>
									<Badge variant="outline">
										Strengths + risks
									</Badge>
								</div>
							{:else}
								<div class="flex items-center justify-between">
									<span>Scoring basis</span>
									<Badge variant="secondary">
										Job description input
									</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Weighted ATS score</span>
									<Badge variant="outline">/ 100</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Pass likelihood</span>
									<Badge variant="outline">%</Badge>
								</div>
								<div class="flex items-center justify-between">
									<span>Gate checks</span>
									<Badge variant="outline">Pass/Fail</Badge>
								</div>
							{/if}
							<Separator />
							<p>
								{isRoleProfileMode()
									? "You get role-fit outcomes: match score, gaps, strengths/risks, and concrete profile-alignment suggestions."
									: "You get ATS outcomes: score, pass likelihood, gate checks, missing keywords, and resume rewrite recommendations."}
							</p>
						</CardContent>
					</Card>

					<Card class="border-border/60 bg-card/90">
						<CardHeader class="space-y-1">
							<CardTitle>Mode difference</CardTitle>
							<CardDescription
								>What changes when you flip the switch</CardDescription
							>
						</CardHeader>
						<CardContent
							class="space-y-3 text-sm text-muted-foreground"
						>
							{#if isRoleProfileMode()}
								<div
									class="rounded-lg border border-border/60 bg-background p-3"
								>
									<p class="font-medium text-foreground">
										Active: Role Profile Match
									</p>
									<p class="mt-1">
										Uses only role profile input and profile
										match prompt.
									</p>
								</div>
								<div
									class="rounded-lg border border-border/60 bg-background p-3"
								>
									<p class="font-medium text-foreground">
										Not active: ATS JD Scoring
									</p>
									<p class="mt-1">
										JD keywords, gate checks, and ATS pillar
										scoring are skipped in this mode.
									</p>
								</div>
							{:else}
								<div
									class="rounded-lg border border-border/60 bg-background p-3"
								>
									<p class="font-medium text-foreground">
										Active: Job Description ATS Scoring
									</p>
									<p class="mt-1">
										Uses only job description input and ATS
										scoring prompt.
									</p>
								</div>
								<div
									class="rounded-lg border border-border/60 bg-background p-3"
								>
									<p class="font-medium text-foreground">
										Not active: Role Profile Match
									</p>
									<p class="mt-1">
										Profile-fit strengths/risks and role
										match-only recommendations are skipped.
									</p>
								</div>
							{/if}
						</CardContent>
					</Card>
				</div>
			</section>
		{:else if stage === "processing"}
			<section class="grid place-items-center">
				<Card class="w-full max-w-2xl">
					<CardHeader class="space-y-2">
						<CardTitle>Scoring your resume</CardTitle>
						<CardDescription>
							{isRoleProfileResult()
								? "We are scoring against your selected role profile and building your report."
								: "We are validating formatting, scoring against the job description, and building your report."}
						</CardDescription>
					</CardHeader>
					<CardContent class="space-y-6">
						<div class="flex items-center gap-4">
							<div
								class="h-12 w-12 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary"
							></div>
							<div>
								<p class="font-medium">Scoring in progress</p>
								<p class="text-sm text-muted-foreground">
									Results will appear automatically.
								</p>
							</div>
						</div>
						<div class="grid gap-3 md:grid-cols-3">
							<Card class="border-border/60">
								<CardHeader class="space-y-1">
									<CardTitle class="text-sm"
										>{isRoleProfileResult()
											? "Evidence extraction"
											: "Gate checks"}</CardTitle
									>
									<CardDescription
										>{isRoleProfileResult()
											? "Resume parsing"
											: "Validating file"}</CardDescription
									>
								</CardHeader>
							</Card>
							<Card class="border-border/60">
								<CardHeader class="space-y-1">
									<CardTitle class="text-sm"
										>{isRoleProfileResult()
											? "Profile match"
											: "ATS scoring"}</CardTitle
									>
									<CardDescription
										>{isRoleProfileResult()
											? "Role-fit scoring"
											: "Applying rubric"}</CardDescription
									>
								</CardHeader>
							</Card>
							<Card class="border-border/60">
								<CardHeader class="space-y-1">
									<CardTitle class="text-sm"
										>Recommendations</CardTitle
									>
									<CardDescription
										>{isRoleProfileResult()
											? "Match suggestions"
											: "Drafting fixes"}</CardDescription
									>
								</CardHeader>
							</Card>
						</div>
					</CardContent>
				</Card>
			</section>
		{:else}
			<section class="space-y-5">
				<section
					class="flex flex-wrap items-center justify-between gap-3"
				>
					<div class="space-y-1">
						<p
							class="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
						>
							Results
						</p>
						<h2 class="text-2xl font-semibold">
							{jobTitle || "Role not specified"}
						</h2>
						<p class="text-sm text-muted-foreground">
							{isRoleProfileResult()
								? "Your role profile match is complete. Review fit signals and next steps."
								: "Your ATS scan is complete. Review the score and next steps."}
						</p>
					</div>
					<div class="flex flex-wrap gap-3">
						<Button variant="outline" onclick={resetForm}
							>Run another scan</Button
						>
						<Button onclick={downloadReport}
							>Download full report</Button
						>
					</div>
				</section>

				{#if isRoleProfileResult()}
					<section class="grid gap-3 lg:grid-cols-4">
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Profile match</CardTitle>
								<CardDescription
									>Score out of 100</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<div class="flex items-end justify-between">
									<p
										class={`text-2xl font-semibold ${getScoreTone(
											aiProfileMatch?.score ?? 0,
										)}`}
									>
										{aiProfileMatch?.score ?? 0}
									</p>
									<Badge variant="outline">
										/ {aiProfileMatch?.scoreOutOf ?? 100}
									</Badge>
								</div>
								<p
									class="text-xs text-muted-foreground break-words"
								>
									{profileCardSummary}
								</p>
							</CardContent>
						</Card>
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Recommendation</CardTitle>
								<CardDescription
									>Overall fit call</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<p class="text-lg font-semibold break-all">
									{aiRecommendation?.label ?? "Not available"}
								</p>
								<p
									class="text-xs text-muted-foreground break-words"
								>
									{recommendationCardSummary}
								</p>
							</CardContent>
						</Card>
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Top gaps</CardTitle>
								<CardDescription
									>Priority blockers</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<p class="text-2xl font-semibold">
									{aiProfileMatch?.topGaps?.length ?? 0}
								</p>
								<p
									class="text-xs text-muted-foreground break-words"
								>
									{topGapsCardSummary}
								</p>
							</CardContent>
						</Card>
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Suggestions</CardTitle>
								<CardDescription
									>Actionable next edits</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<p class="text-2xl font-semibold">
									{aiProfileMatch?.suggestions?.length ?? 0}
								</p>
								<p
									class="text-xs text-muted-foreground break-words"
								>
									{suggestionsCardSummary}
								</p>
							</CardContent>
						</Card>
					</section>

					<section class="grid gap-3 lg:grid-cols-3">
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Top gaps</CardTitle>
								<CardDescription>
									Where the profile fit is weak
								</CardDescription>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								{#if aiProfileMatch?.topGaps?.length}
									{#each aiProfileMatch.topGaps as gap}
										<div
											class="rounded-lg border border-border/60 bg-background px-3 py-2"
										>
											<p>{gap}</p>
										</div>
									{/each}
								{:else}
									<p class="text-muted-foreground">
										No profile gaps returned.
									</p>
								{/if}
							</CardContent>
						</Card>
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Suggestions</CardTitle>
								<CardDescription
									>Targeted improvements</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								{#if aiProfileMatch?.suggestions?.length}
									{#each aiProfileMatch.suggestions as suggestion}
										<div
											class="rounded-lg border border-border/60 bg-background px-3 py-2"
										>
											<p>{suggestion}</p>
										</div>
									{/each}
								{:else}
									<p class="text-muted-foreground">
										No role-profile suggestions returned.
									</p>
								{/if}
							</CardContent>
						</Card>
						<Card
							class="border-border/60 bg-card/90 overflow-hidden"
						>
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Fit signals</CardTitle>
								<CardDescription
									>Strengths and risks</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-3 pt-0 text-sm">
								<div>
									<p class="font-medium">Strengths</p>
									<div class="mt-2 flex flex-wrap gap-2">
										{#if aiFitSignals?.strengths?.length}
											{#each aiFitSignals.strengths as item}
												<Badge
													variant="secondary"
													class="max-w-full whitespace-normal break-words text-left leading-snug"
													>{item}</Badge
												>
											{/each}
										{:else}
											<Badge variant="outline"
												>Not available</Badge
											>
										{/if}
									</div>
								</div>
								<div>
									<p class="font-medium">Risks</p>
									<div class="mt-2 flex flex-wrap gap-2">
										{#if aiFitSignals?.risks?.length}
											{#each aiFitSignals.risks as item}
												<Badge
													variant="outline"
													class="max-w-full whitespace-normal break-words text-left leading-snug"
													>{item}</Badge
												>
											{/each}
										{:else}
											<Badge variant="outline"
												>Not available</Badge
											>
										{/if}
									</div>
								</div>
							</CardContent>
						</Card>
					</section>
				{:else}
					<section class="grid gap-3 lg:grid-cols-3">
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>ATS score</CardTitle>
								<CardDescription
									>Weighted out of 100</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<div class="flex items-end justify-between">
									<p
										class={`text-2xl font-semibold ${getScoreTone(
											aiSummary?.totalScore ??
												results.score,
										)}`}
									>
										{aiSummary?.totalScore ?? results.score}
									</p>
									<Badge variant="outline">
										/ {aiSummary?.scoreOutOf ?? 100}
									</Badge>
								</div>
								{#if aiSummary?.scoreSummary}
									<p class="text-xs text-muted-foreground">
										{limitWords(aiSummary.scoreSummary)}
									</p>
								{/if}
							</CardContent>
						</Card>
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Pass likelihood</CardTitle>
								<CardDescription
									>Based on gates + rubric</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<div class="flex items-end justify-between">
									<p
										class={`text-2xl font-semibold ${getScoreTone(
											aiSummary?.passLikelihoodPercent ??
												results.passLikelihood,
										)}`}
									>
										{aiSummary?.passLikelihoodPercent ??
											results.passLikelihood}
										%
									</p>
									<Badge variant="secondary">
										{getPassLabel(
											aiSummary?.passLikelihoodPercent ??
												results.passLikelihood,
										)}
									</Badge>
								</div>
								{#if aiSummary?.passLikelihoodSummary}
									<p class="text-xs text-muted-foreground">
										{limitWords(
											aiSummary.passLikelihoodSummary,
										)}
									</p>
								{/if}
							</CardContent>
						</Card>
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Results</CardTitle>
								<CardDescription
									>Summary insights</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								<div class="flex items-center justify-between">
									<p
										class="text-xs uppercase tracking-[0.2em] text-muted-foreground"
									>
										After top 3 fixes
									</p>
									<p
										class={`text-lg font-semibold ${getScoreTone(
											aiSummary?.estimatedScoreAfterTop3 ??
												results.score,
										)}`}
									>
										{aiSummary?.estimatedScoreAfterTop3 ??
											results.score}
									</p>
								</div>
								<p class="text-xs text-muted-foreground">
									{aiSummary?.resultsSummary
										? limitWords(aiSummary.resultsSummary)
										: limitWords(
												aiSummary?.confidenceNote ??
													"Based on provided role details.",
											)}
								</p>
							</CardContent>
						</Card>
					</section>

					<section class="grid gap-3 lg:grid-cols-3">
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Score breakdown</CardTitle>
								<CardDescription
									>Weighted pillars</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								{#if aiPillarScores.length > 0}
									{#each aiPillarScores as item}
										<div
											class="flex items-center justify-between"
										>
											<span class="text-muted-foreground">
												{item.pillar ?? "Pillar"}
											</span>
											<Badge variant="outline"
												>{item.score ?? 0}</Badge
											>
										</div>
									{/each}
								{:else}
									{#each Object.entries(results.breakdown) as [label, value]}
										<div
											class="flex items-center justify-between"
										>
											<span class="text-muted-foreground"
												>{label}</span
											>
											<Badge variant="outline"
												>{value}</Badge
											>
										</div>
									{/each}
								{/if}
							</CardContent>
						</Card>
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Gate checks</CardTitle>
								<CardDescription
									>Parsing requirements</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								{#if aiGateChecks.length > 0}
									{#each aiGateChecks as item}
										<div
											class="flex items-center justify-between"
										>
											<span class="text-muted-foreground">
												{item.gate ?? "Gate"}
											</span>
											<Badge
												variant={getGateVariant(
													item.status,
												)}
											>
												{item.status ?? "unknown"}
											</Badge>
										</div>
									{/each}
								{:else}
									{#each Object.entries(results.gateChecks) as [label, value]}
										<div
											class="flex items-center justify-between"
										>
											<span class="text-muted-foreground"
												>{label}</span
											>
											<Badge variant="outline"
												>{value}</Badge
											>
										</div>
									{/each}
								{/if}
							</CardContent>
						</Card>
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Missing keywords</CardTitle>
								<CardDescription
									>Grouped by priority</CardDescription
								>
							</CardHeader>
							<CardContent class="space-y-3 pt-0 text-sm">
								<div>
									<p class="font-medium">
										Required but missing
									</p>
									<div class="mt-2 flex flex-wrap gap-2">
										{#if aiMissingKeywords.required?.length}
											{#each aiMissingKeywords.required as item}
												<Badge variant="secondary"
													>{item}</Badge
												>
											{/each}
										{:else}
											{#each results.missingRequired as item}
												<Badge variant="secondary"
													>{item}</Badge
												>
											{/each}
										{/if}
									</div>
								</div>
								<div>
									<p class="font-medium">
										Preferred but missing
									</p>
									<div class="mt-2 flex flex-wrap gap-2">
										{#if aiMissingKeywords.preferred?.length}
											{#each aiMissingKeywords.preferred as item}
												<Badge variant="outline"
													>{item}</Badge
												>
											{/each}
										{:else}
											{#each results.missingPreferred as item}
												<Badge variant="outline"
													>{item}</Badge
												>
											{/each}
										{/if}
									</div>
								</div>
							</CardContent>
						</Card>
					</section>

					<section class="grid gap-3 lg:grid-cols-2">
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Top improvements</CardTitle>
								<CardDescription>
									Prioritized by score impact
								</CardDescription>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								{#if aiImprovements.length > 0}
									{#each aiImprovements as item}
										<div
											class="rounded-lg border border-border/60 bg-background px-3 py-2"
										>
											<p class="font-medium">
												{item.priority ?? "Priority"} · +
												{item.estimatedImpact ?? 0} points
											</p>
											<p>{item.issue ?? ""}</p>
											<p class="text-muted-foreground">
												{item.fix ?? ""}
											</p>
											{#if item.example}
												<p
													class="text-muted-foreground"
												>
													{item.example}
												</p>
											{/if}
										</div>
									{/each}
								{:else}
									{#each results.improvements as item}
										<div
											class="rounded-lg border border-border/60 bg-background px-3 py-2"
										>
											<p class="font-medium">
												{item.title}
											</p>
											<p>{item.body}</p>
											<p class="text-muted-foreground">
												{item.helper}
											</p>
										</div>
									{/each}
								{/if}
							</CardContent>
						</Card>
						<Card class="border-border/60 bg-card/90">
							<CardHeader class="space-y-1 pb-2">
								<CardTitle>Copy-ready lines</CardTitle>
								<CardDescription>
									Provided when clarity is high
								</CardDescription>
							</CardHeader>
							<CardContent class="space-y-2 pt-0 text-sm">
								{#if aiCopyPaste.length > 0}
									{#each aiCopyPaste as line}
										<div
											class="rounded-lg border border-border/60 bg-background px-3 py-2"
										>
											<p class="text-muted-foreground">
												{line.text ?? ""}
											</p>
										</div>
									{/each}
									{#if aiCopyPasteNote}
										<p
											class="text-xs text-muted-foreground"
										>
											{aiCopyPasteNote}
										</p>
									{/if}
								{:else}
									{#each results.copyPaste as line}
										<div
											class="rounded-lg border border-border/60 bg-background px-3 py-2"
										>
											<p class="text-muted-foreground">
												{line}
											</p>
										</div>
									{/each}
								{/if}
							</CardContent>
						</Card>
					</section>
				{/if}
			</section>
		{/if}
	</main>
</div>
