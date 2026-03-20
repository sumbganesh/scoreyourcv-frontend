<script lang="ts">
	import "./app.css";
	import { onMount } from "svelte";
	import { Button } from "$lib/components/ui/button";
	import { Badge } from "$lib/components/ui/badge";
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger,
	} from "$lib/components/ui/accordion";
	import { Separator } from "$lib/components/ui/separator";
	import { getDistinctId, initAnalytics, trackEvent } from "$lib/analytics";

	onMount(() => {
		initAnalytics();
		trackEvent("landing_page_viewed", {
			page: "landing",
			distinct_id: getDistinctId(),
		});
	});

	const trackLandingCtaClick = (placement: string) => {
		trackEvent("landing_cta_clicked", {
			page: "landing",
			placement,
		});
	};
</script>

<svelte:head>
	<title>Score Your CV — ATS Resume Score for Candidates</title>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	<div class="relative overflow-hidden">
		<div class="pointer-events-none absolute inset-0">
			<div
				class="absolute -left-24 top-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
			></div>
			<div
				class="absolute right-0 top-0 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl"
			></div>
			<div
				class="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-sky-500/10 blur-3xl"
			></div>
		</div>

		<header
			class="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6"
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
			<nav
				class="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex"
			>
				<a
					class="transition-colors hover:text-foreground"
					href="#product">Overview</a
				>
				<a
					class="transition-colors hover:text-foreground"
					href="#benefits">What you get</a
				>
				<a class="transition-colors hover:text-foreground" href="#how"
					>How it works</a
				>
				<a class="transition-colors hover:text-foreground" href="#trust"
					>Security</a
				>
				<a class="transition-colors hover:text-foreground" href="#faq"
					>Questions</a
				>
			</nav>
			<div class="flex items-center gap-3">
				<Button
					size="sm"
					href="/candidates/screening/"
					onclick={() => trackLandingCtaClick("header")}
				>
					>Score My CV</Button
				>
			</div>
		</header>

		<main class="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-8">
			<section
				id="product"
				class="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
			>
				<div class="space-y-8">
					<div class="flex flex-wrap gap-2">
						<Badge variant="secondary"
							>Candidate-first scoring</Badge
						>
						<Badge variant="secondary"
							>Check against JD or Job Profile</Badge
						>
						<Badge variant="secondary">Results in minutes</Badge>
					</div>
					<div class="space-y-6">
						<h1
							class="text-4xl font-semibold leading-tight text-balance md:text-5xl"
						>
							Score your CV before you apply
						</h1>
						<p class="text-lg text-muted-foreground">
							Score Your CV mirrors ATS logic with gate checks and
							a weighted rubric. Get a clear score, missing
							keywords, and fixes you can apply today.
						</p>
					</div>
					<div
						class="flex flex-col gap-4 sm:flex-row sm:items-center"
					>
						<Button
							size="lg"
							href="/candidates/screening/"
							onclick={() => trackLandingCtaClick("hero_primary")}
						>
							>Score my CV</Button
						>
						<Button variant="outline" size="lg" href="#how"
							>See how it works</Button
						>
					</div>
					<div
						class="flex flex-wrap gap-2 text-xs text-muted-foreground"
					>
						<span>Downloadable report</span>
						<span>•</span>
						<span>Results in minutes</span>
						<span>•</span>
						<span>Single scan, no subscription</span>
					</div>
					<div class="grid gap-6 sm:grid-cols-3">
						<div class="space-y-2">
							<p class="text-2xl font-semibold">Five pillars</p>
							<p class="text-sm text-muted-foreground">
								Transparent scoring by pillar
							</p>
						</div>
						<div class="space-y-2">
							<p class="text-2xl font-semibold">Gate checks</p>
							<p class="text-sm text-muted-foreground">
								Stop parsing errors before scoring
							</p>
						</div>
						<div class="space-y-2">
							<p class="text-2xl font-semibold">Suggestions</p>
							<p class="text-sm text-muted-foreground">
								Actionable improvements you can copy-paste
							</p>
						</div>
					</div>
				</div>

				<Card
					class="border-border/60 bg-card/80 shadow-xl backdrop-blur"
				>
					<CardHeader class="space-y-3">
						<Badge variant="outline">Snapshot</Badge>
						<CardTitle class="text-2xl"
							>ATS Score: 86 / 100</CardTitle
						>
						<CardDescription
							>Target role: Product Marketing Manager</CardDescription
						>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center justify-between text-sm">
							<span class="text-muted-foreground"
								>Gate checks</span
							>
							<Badge>All clear</Badge>
						</div>
						<Separator />
						<div class="space-y-3 text-sm">
							<div class="flex items-center justify-between">
								<span>JD relevance</span>
								<Badge variant="outline">88</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>Keyword coverage</span>
								<Badge variant="outline">82</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>Experience alignment</span>
								<Badge variant="outline">84</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>ATS formatting</span>
								<Badge variant="outline">92</Badge>
							</div>
						</div>
						<Separator />
						<div
							class="rounded-lg border border-border/60 bg-background px-4 py-3 text-sm"
						>
							<p class="font-medium pb-2">Improvements</p>
							<p class="text-muted-foreground">
								Add “lifecycle marketing” and “retention
								analytics” to your summary and latest role to
								raise keyword coverage.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			<div class="mt-10 text-xs text-muted-foreground">
				Designed for candidates who want clear, actionable ATS feedback.
			</div>

			<Separator class="my-16" />

			<section class="space-y-4">
				<Badge variant="outline">The problem</Badge>
				<h2 class="text-3xl font-semibold">
					ATS decisions are a black box
				</h2>
				<p class="max-w-3xl text-muted-foreground">
					You can tailor every line and still hear nothing back. The
					ATS sees formatting, keywords, and structure before any
					human does. Score Your CV turns that black box into a clear
					score and a list of fixes.
				</p>
			</section>

			<Separator class="my-16" />

			<section id="benefits" class="space-y-10">
				<div class="space-y-4">
					<Badge variant="outline">What you get</Badge>
					<h2 class="text-3xl font-semibold">
						Everything you need before you apply
					</h2>
					<p class="max-w-3xl text-muted-foreground">
						Get your ATS score, see what is missing, and apply fixes
						that increase your pass likelihood.
					</p>
				</div>
				<div class="grid gap-6 md:grid-cols-3">
					<div class="space-y-2">
						<p class="text-lg font-semibold">
							ATS score out of 100
						</p>
						<p class="text-sm text-muted-foreground">
							See where you stand before you apply.
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-lg font-semibold">Missing keywords</p>
						<p class="text-sm text-muted-foreground">
							Priority list based on the JD or role profile.
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-lg font-semibold">Copy‑ready fixes</p>
						<p class="text-sm text-muted-foreground">
							Paste‑ready improvements when clarity is high.
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-lg font-semibold">Gate check results</p>
						<p class="text-sm text-muted-foreground">
							Catch ATS parsing blockers early.
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-lg font-semibold">Pass likelihood</p>
						<p class="text-sm text-muted-foreground">
							Know how strong your match is.
						</p>
					</div>
					<div class="space-y-2">
						<p class="text-lg font-semibold">Downloadable report</p>
						<p class="text-sm text-muted-foreground">
							Save results and compare improvements.
						</p>
					</div>
				</div>
			</section>

			<Separator class="my-16" />

			<section
				id="how"
				class="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
			>
				<div class="space-y-5">
					<Badge variant="outline">How it works</Badge>
					<h2 class="text-3xl font-semibold">
						A simple, ATS-aligned workflow
					</h2>
					<p class="text-muted-foreground">
						Validate first, score second, improve last. The rubric
						mirrors how ATS systems screen resumes.
					</p>
					<div class="grid gap-4 sm:grid-cols-3">
						<Card>
							<CardHeader>
								<CardTitle>1. Validate</CardTitle>
								<CardDescription
									>ATS parsing gates</CardDescription
								>
							</CardHeader>
							<CardContent class="text-sm text-muted-foreground">
								Catch parsing blockers before scoring.
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>2. Score</CardTitle>
								<CardDescription
									>Five weighted pillars</CardDescription
								>
							</CardHeader>
							<CardContent class="text-sm text-muted-foreground">
								JD relevance, keywords, experience, formatting,
								clarity.
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle>3. Improve</CardTitle>
								<CardDescription
									>Actionable fixes</CardDescription
								>
							</CardHeader>
							<CardContent class="text-sm text-muted-foreground">
								Apply missing keywords and copy-ready upgrades.
							</CardContent>
						</Card>
					</div>
				</div>
				<Card class="border-border/60 bg-card/80 shadow-lg">
					<CardHeader>
						<CardTitle>Score summary example</CardTitle>
						<CardDescription
							>Role: Senior Data Analyst</CardDescription
						>
					</CardHeader>
					<CardContent class="space-y-4 text-sm">
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">ATS score</span>
							<Badge>86 / 100</Badge>
						</div>
						<Separator />
						<div class="space-y-3">
							<div class="flex items-center justify-between">
								<span>Pass likelihood</span>
								<Badge variant="outline">82%</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>Missing keywords</span>
								<Badge variant="outline">3</Badge>
							</div>
							<div class="flex items-center justify-between">
								<span>Formatting</span>
								<Badge variant="outline">Clear</Badge>
							</div>
						</div>
						<Separator />
						<div
							class="rounded-lg border border-border/60 bg-background px-4 py-3"
						>
							<p class="text-sm font-medium">Top fix</p>
							<p class="text-sm text-muted-foreground">
								Add “lifecycle marketing” and “retention
								analytics” to your summary and latest role.
							</p>
						</div>
					</CardContent>
				</Card>
			</section>

			<Separator class="my-16" />

			<section id="trust" class="space-y-8">
				<div class="space-y-3">
					<Badge variant="outline">Trust</Badge>
					<h2 class="text-3xl font-semibold">
						Scoring you can trust
					</h2>
				</div>
				<div class="grid gap-6 md:grid-cols-3">
					<Card>
						<CardHeader>
							<CardTitle>JD-first scoring</CardTitle>
							<CardDescription
								>Role-specific rubric</CardDescription
							>
						</CardHeader>
						<CardContent class="text-sm text-muted-foreground">
							Your score starts with the JD or role profile you
							provide.
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Parsing safeguards</CardTitle>
							<CardDescription>ATS protection</CardDescription>
						</CardHeader>
						<CardContent class="text-sm text-muted-foreground">
							Formatting and layout gates prevent hidden parsing
							failures.
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle>Explainable scoring</CardTitle>
							<CardDescription
								>Every score justified</CardDescription
							>
						</CardHeader>
						<CardContent class="text-sm text-muted-foreground">
							Scores map to the rubric and highlight missing JD
							requirements.
						</CardContent>
					</Card>
				</div>
			</section>

			<Separator class="my-16" />

			<section id="faq" class="space-y-8">
				<div class="space-y-3">
					<Badge variant="outline">FAQ</Badge>
					<h2 class="text-3xl font-semibold">
						Answers before you scan
					</h2>
				</div>
				<Accordion type="single" class="w-full">
					<AccordionItem value="item-1">
						<AccordionTrigger
							>Is this a one-time scan or ongoing access?</AccordionTrigger
						>
						<AccordionContent>
							It is a single scan. Upload once and get your score,
							missing keywords, and prioritized fixes.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-2">
						<AccordionTrigger
							>Can I save or download my results?</AccordionTrigger
						>
						<AccordionContent>
							Yes. Download a report after each scan, and we may
							keep your latest results so you can compare
							improvements.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem value="item-3">
						<AccordionTrigger
							>Do I need a job description?</AccordionTrigger
						>
						<AccordionContent>
							A JD produces the most accurate relevance and
							keyword scores. A role profile works, but confidence
							is lower.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</section>

			<Separator class="my-16" />

			<section>
				<Card class="bg-primary text-primary-foreground">
					<CardHeader class="space-y-2">
						<CardTitle class="text-2xl text-primary-foreground"
							>Ready to score your CV?</CardTitle
						>
						<CardDescription class="text-primary-foreground/80">
							Upload your resume and get your ATS score, missing
							keywords, and fixes in minutes.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							size="lg"
							variant="secondary"
							href="/candidates/screening/">Score my CV</Button
						>
					</CardContent>
				</Card>
			</section>
		</main>

		<Separator class="my-16" />

		<footer class="mx-auto w-full max-w-6xl px-6 pb-16">
			<div class="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
				<div class="space-y-4">
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-semibold"
						>
							SC
						</div>
						<div>
							<p
								class="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground"
							>
								Score Your CV
							</p>
							<p class="text-sm font-semibold">
								ATS Resume Scoring
							</p>
						</div>
					</div>
					<p class="max-w-sm text-sm text-muted-foreground">
						ATS-grade clarity for candidates who want to improve
						their resume before they apply.
					</p>
				</div>
				<div class="space-y-3">
					<p
						class="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground"
					>
						Get started
					</p>
					<p class="text-sm text-muted-foreground">
						Score your CV, fix weak spots, and apply with
						confidence.
					</p>
					<Button size="sm" href="/candidates/screening/"
						>Score my CV</Button
					>
				</div>
			</div>
			<Separator class="my-8" />
			<div
				class="flex flex-col gap-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
			>
				<span>© 2026 Score Your CV. All rights reserved.</span>
				<div class="flex flex-wrap gap-4">
					<a class="hover:text-foreground" href="#benefits"
						>What you get</a
					>
					<a class="hover:text-foreground" href="#how">How it works</a
					>
					<a class="hover:text-foreground" href="#trust">Trust</a>
				</div>
			</div>
		</footer>
	</div>
</div>
