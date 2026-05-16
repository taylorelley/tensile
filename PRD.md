---

# Product Requirements Document
## Adaptive Strength Training PWA — "Forge"
**Version:** 1.0  
**Status:** Draft — Internal  
**Date:** May 2026  
**Author:** Internal  

---

## Table of Contents

1. [Document Control & Purpose](#1-document-control--purpose)
2. [Product Vision & Strategic Goals](#2-product-vision--strategic-goals)
3. [Target Users & Personas](#3-target-users--personas)
4. [Scientific Foundation & Methodology](#4-scientific-foundation--methodology)
   - 4.1 Epistemological Stance
   - 4.2 Autoregulation via RPE/RIR
   - 4.3 Estimated 1RM (e1RM)
   - 4.4 Bottom-Up Periodisation & Development Blocks
   - 4.5 Intra-Session Volume Autoregulation
   - 4.6 Volume Landmarks: MEV, MAV, MRV
   - 4.7 Cumulative Load Tracking: The Session Fatigue Index
   - 4.8 Daily Readiness & Wellness Monitoring
   - 4.9 Weak Point Analysis
   - 4.10 Deload & Pivot Block Theory
   - 4.11 Velocity-Based Training (VBT) Integration
5. [Expert System Architecture](#5-expert-system-architecture)
6. [Algorithm Specifications](#6-algorithm-specifications)
   - 6.1 e1RM Ensemble
   - 6.2 Session Fatigue Index (SFI)
   - 6.3 Readiness Composite Score (RCS)
   - 6.4 Volume Autoregulation: Intra-Session Drop Protocol
   - 6.5 Weekly Volume Budget Algorithm
   - 6.6 Development Block & Time-to-Peak (TTP) Detection
   - 6.7 Weak Point Recommendation Engine
   - 6.8 Deload Trigger Algorithm
   - 6.9 Competition Peaking Scheduler
7. [Feature Specifications](#7-feature-specifications)
   - 7.1 Onboarding: Biometric & Baseline Assessment
   - 7.2 Programme Generator
   - 7.3 Daily Session Flow
   - 7.4 Block Review & Analytics Dashboard
   - 7.5 User Override & Collaborative Mode
   - 7.6 Deload & Pivot Block Management
   - 7.7 Competition Peaking Planner
   - 7.8 Notifications & Engagement
8. [Data Model](#8-data-model)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Out of Scope / Future Phases](#10-out-of-scope--future-phases)
11. [Open Questions & Decisions](#11-open-questions--decisions)
12. [Appendices](#12-appendices)

---

## 1. Document Control & Purpose

### 1.1 Purpose

This PRD defines the product requirements for *Forge*, an adaptive strength training Progressive Web Application. The document specifies the scientific methodology, algorithmic logic, feature set, data model, and non-functional requirements required to build a production-grade, privately-deployed strength training system.

The primary design imperative is to operationalise a rules-based expert system that applies evidence-grounded sports science to provide highly individualised, autoregulated strength and powerlifting programming. The system must adapt to the user's daily biological state, manage cumulative fatigue across the macrocycle, and provide actionable diagnostics for technical and structural weak points — without relying on opaque machine learning models whose decisions cannot be explained or audited.

### 1.2 Scope

This PRD covers:
- All user-facing features for Version 1.0
- The full algorithmic specification for the core training engine
- The data model and state machine logic
- Non-functional requirements for the PWA deployment

Out of scope for this document: UI/UX design system, infrastructure provisioning, specific frontend framework selection, and third-party integrations (wearables, VBT hardware), which are addressed in separate engineering documents.

### 1.3 Scientific Integrity Statement

All algorithmic claims in this document are annotated with their evidence basis. Three tiers of evidence confidence are used throughout:

- **[VALIDATED]** — Directly supported by peer-reviewed literature with replication
- **[HEURISTIC]** — Consistent with the evidence but the specific formulation is a coaching/practitioner estimate, not directly measured in controlled trials
- **[PROPRIETARY]** — Novel formulation developed for this system; presented to users as an internal metric, not as an externally validated scientific construct

This annotation system must be preserved in all downstream technical documentation and any user-facing explanations of the system's logic.

---

## 2. Product Vision & Strategic Goals

### 2.1 Vision Statement

To provide the gold-standard training intelligence layer for intermediate-to-advanced powerlifters and strength athletes: a system that reasons about their physiology the way an elite coach would, without requiring constant human oversight.

### 2.2 Core Design Principles

**Responsiveness over prediction.** The system does not attempt to predict the user's biology six weeks in advance. It collects data, detects patterns, and responds. Prescriptions are generated one session at a time based on accumulating evidence.

**Transparency over automation.** Every adjustment the system makes is explainable. The user can always ask "why did the system change my programme?" and receive a plain-language, evidence-referenced answer. No black-box outputs.

**Human authority.** The expert system is a guide. The user has ultimate authority to override any prescription. Overrides are recorded, analysed, and fed back into the model. Athletes who override frequently are not penalised — they are studied.

**Conservative loading philosophy.** In cases of ambiguity (uncertain readiness, conflicting signals, novel movement), the system defaults to the lower loading option. Missed adaptation is recoverable; injury is not.

**Progressive individualisation.** The system begins with population-average starting parameters and personalises every variable — RPE-to-load mappings, volume tolerances, Time-to-Peak, deload frequency — as user data accumulates. On Week 1, it is generic. By Week 12, it is uniquely theirs.

### 2.3 Strategic Goals

| Goal | Metric | Target (12 months post-launch) |
|---|---|---|
| User adherence | % of prescribed sessions completed | >80% |
| Strength progression | Average e1RM improvement per 8-week block in primary lifts | >3% |
| Overtraining incidents | User-reported injury or forced deload events per block | <0.5 |
| System trust | User override rate (declining system prescription) | <15% of sessions |
| RPE accuracy | Mean absolute error between user RPE and VBT-calibrated RPE (where available) | <0.8 RPE units |

---

## 3. Target Users & Personas

### 3.1 Primary Persona: The Competitive Powerlifter

**Profile:** 2–10 years of structured training. Competes in sanctioned meets (IPF, USAPL, WRPF, or federation equivalents). Familiar with RPE, percentage-based programming, and basic periodisation concepts. Primary lifts: squat, bench press, deadlift (the SBD). Goal: maximise total for the next competition. Training frequency: 3–5 days per week.

**Pain points:** Existing percentage-based programmes ignore daily fatigue. Cannot reliably time a peak to competition. Weak-point diagnosis is guesswork without a coach.

**Technical comfort:** Moderate-to-high. Comfortable with detailed training data. Expects professional-grade analytics.

### 3.2 Secondary Persona: The Strength Enthusiast

**Profile:** 1–4 years of serious training. No current competition plans but interested in structured, evidence-based programming. Primary lifts: squat, bench press, deadlift, and possibly overhead press. Goal: systematic strength gains with appropriate hypertrophy support. Training frequency: 3–4 days per week.

**Pain points:** Generic programming apps provide no adaptation. Not confident interpreting RPE or managing fatigue. Wants to train smarter without hiring a coach.

**Technical comfort:** Moderate. Prefers guidance over raw data. Needs the system to explain its reasoning.

### 3.3 Out-of-Scope User

Novice lifters (< 6 months of barbell training) are explicitly out of scope for Version 1.0. RPE accuracy, the foundation of this system, is unreliable in true novices (Zourdos et al., 2016) [VALIDATED]. An onboarding gate will prevent onboarding users who report fewer than 6 months of consistent barbell training and will redirect them to a simpler linear progression tool (future phase).

---

## 4. Scientific Foundation & Methodology

This section documents the evidence base, validated claims, and heuristic assumptions underlying every major system component. Engineering decisions must trace back to a specific subsection here.

### 4.1 Epistemological Stance

Traditional periodisation models (Zatsiorsky's linear periodisation, Soviet bloc periodisation) are top-down and predictive: they assume a lifter can be programmed to a performance peak at a specific future date via a predetermined series of phases. This approach has two fatal flaws for the individual athlete:

1. It assumes a static, known level of daily readiness — ignoring CNS fatigue, sleep debt, psychological stress, and nutritional fluctuations that cause the same absolute load to represent wildly different physiological stimuli on different days.
2. It assumes biological adaptation proceeds on a universal timeline — ignoring the empirically documented, highly individual Time-to-Peak phenomenon observed by Bondarchuk and reproduced anecdotally across thousands of coached athletes.

Forge adopts a **bottom-up, responsive architecture**: prescriptions are generated session by session from accumulating data, not derived from a pre-authored plan. The macrocycle structure *emerges* from the microcycle data rather than being imposed in advance.

This is not a novel philosophical position. It directly applies Mike Tuchscherer's Reactive Training Systems (RTS) framework and the Evolve AI Genesis Engine paradigm, situated within the broader evidence base from autoregulation research (Hickmott et al., 2022; Larsen et al., 2021; Helms et al., 2018) [VALIDATED].

### 4.2 Autoregulation via RPE/RIR [VALIDATED with caveats]

#### 4.2.1 The RIR-Anchored RPE Scale

Forge uses the Repetitions-in-Reserve (RIR) anchored Rate of Perceived Exertion scale, as described by Zourdos et al. (2016), Tuchscherer (2008), and Helms et al. (2017). This scale replaces the classic Borg 6–20 scale (designed for aerobic exercise) with one specifically calibrated to the neuromuscular demands of heavy resistance training.

| RPE | RIR | Operational Definition |
|---|---|---|
| 10 | 0 | Absolute maximal effort; no additional repetitions possible without technical breakdown |
| 9.5 | ~0–0.5 | Would definitely fail the next rep or it would be a grind |
| 9 | 1 | Could have completed exactly one more repetition |
| 8.5 | 1–2 | Solid double in reserve; next rep would be very hard |
| 8 | 2 | Could have completed two more repetitions; bar speed perceptibly slower than maximum |
| 7.5 | 2–3 | Two to three repetitions left; bar speed meaningfully slower than maximum |
| 7 | 3 | Three repetitions in reserve; moderate effort |
| 6 | 4+ | Comfortable work; 4+ repetitions remaining |
| ≤5 | 5+ | Warm-up territory |

**Evidence base:** Zourdos et al. (2016) found a strong inverse correlation between RIR-based RPE and mean concentric bar velocity in experienced squatters (r = −0.88, p < 0.001). At maximal loads (100% 1RM), experienced lifters assigned a mean RPE of 9.80 ± 0.18 — demonstrating high accuracy at near-maximal intensities [VALIDATED]. Novices showed lower accuracy (r = −0.77; mean RPE at 1RM = 8.96 ± 0.43), particularly at submaximal loads [VALIDATED — limitation applies].

**Critical implementation caveat — RPE accuracy degrades at lower intensities.** Multiple studies (Zourdos et al., 2021; Armes et al., 2020; Hackett et al., 2012) confirm that RIR prediction becomes substantially less accurate at RIRs of 3 or more — that is, when the set is prescribed at RPE 7 or below. Lifters systematically underestimate how many more reps they could complete. The system must treat low-RPE inputs (≤ RPE 7) with reduced confidence and will not make major load adjustments based on them alone [VALIDATED — limitation].

**Novice calibration:** Users who report less than 2 years of barbell training will be flagged as requiring RPE calibration. During the first 4 weeks, the system will periodically cross-reference the user's RPE call against their rep completion rate (if they achieve more reps than should be possible at their stated RPE, the system flags a calibration discrepancy and prompts the user to re-evaluate their RPE scale interpretation). [HEURISTIC implementation of a VALIDATED limitation]

#### 4.2.2 RPE-to-Percentage Mapping

The system uses the Tuchscherer/Helms RPE-to-percentage chart as an initial population-average starting point for estimating absolute loads from RPE targets. This chart maps sets-and-reps to approximate % of 1RM at each RPE level (e.g., 3 reps @ RPE 8 ≈ 87% of 1RM; 1 rep @ RPE 9 ≈ 89% of 1RM).

**Critical caveat:** These mappings are population averages with substantial individual variation. They are *not* universal constants [HEURISTIC]. The system's progressive individualisation layer will continuously calibrate user-specific RPE-to-percentage mappings using actual performance data. After 4 weeks, the system's internal load predictions derive from the user's personal performance history, not the generic chart.

### 4.3 Estimated 1RM (e1RM) [VALIDATED]

#### 4.3.1 Purpose

The e1RM is the system's primary performance progress metric. It is calculated continuously across all training sessions without requiring a maximal test. By tracking the e1RM trend across weeks and blocks, the system detects progression, peak, and regression for block management.

#### 4.3.2 Ensemble Calculation

A single e1RM formula carries inherent biases. Forge uses an ensemble approach, averaging up to three estimation methods with confidence-weighted averaging based on the quality of the available data.

**Method 1 — Rep-Based Formula (Epley/Brzycki Ensemble):**

When a set is performed at ≥ RPE 8 (i.e., within 2 reps of failure), rep-based e1RM estimation is accurate to within approximately 2–5% (LeSuer et al., 1997; DiStasio, 2014) [VALIDATED]. The system computes both Epley and Brzycki estimates and averages them:

```
Epley:   e1RM = load × (1 + reps / 30)
Brzycki: e1RM = load / (1.0278 − 0.0278 × reps)
Rep-based estimate = (Epley + Brzycki) / 2
```

This method carries high confidence (weight = 1.0) when reps ≤ 5 at RPE ≥ 8, decreasing confidence (weight = 0.7) for reps 6–10, and low confidence (weight = 0.4) for reps > 10.

**Method 2 — RPE-Adjusted Formula:**

Using the user's personalised RPE-to-percentage table (calibrated from their training history), the system estimates e1RM as:

```
e1RM = load / RPE_percentage_lookup(reps, RPE)
```

This method carries high confidence (weight = 1.0) when the user's RPE accuracy is high (calibrated users with < 0.5 RPE unit historical error), decreasing confidence (weight = 0.5) for uncalibrated or novice users.

**Method 3 — Velocity-Based (optional, requires hardware):**

When the user connects a VBT device (linear position transducer or smartphone video-based velocity tracking), mean propulsive velocity at a given load is used to estimate e1RM via the user's individualised load-velocity profile:

```
e1RM = load / (user_v1RM_coefficient × velocity + user_v1RM_intercept)
```

Where `user_v1RM_coefficient` and `user_v1RM_intercept` are derived from two-point load-velocity profiling (García-Ramos et al., 2018) [VALIDATED]. This method carries high confidence (weight = 1.2, slightly elevated because it is objective) when the user's load-velocity profile has ≥ 10 calibration data points.

**Ensemble output:**

```
e1RM_ensemble = Σ(method_i_estimate × method_i_weight × method_i_confidence)
                ─────────────────────────────────────────────────────────────
                        Σ(method_i_weight × method_i_confidence)
```

The system displays a point estimate and a ±% confidence interval that reflects the number of methods available and their individual reliability. The user sees: *"Estimated 1RM: 187.5 kg (±4%)"*.

#### 4.3.3 Session vs. Rolling e1RM

The system maintains two distinct e1RM values per lift:

- **Session e1RM:** calculated from the current session's best set. Used for same-session load prescription.
- **Rolling e1RM:** an exponentially weighted moving average (EWMA) across the last N sessions (default N = 5, configurable per user). Used for block-level progress tracking and TTP detection. Smoothed EWMA reduces noise from anomalous sessions.

```
Rolling_e1RM[t] = α × Session_e1RM[t] + (1 − α) × Rolling_e1RM[t−1]
Default α = 0.3 (30% weight on the most recent session)
```

### 4.4 Bottom-Up Periodisation & Development Blocks [HEURISTIC, grounded in Bondarchuk]

#### 4.4.1 Theoretical Basis

Forge's macrocycle structure is derived from Anatoliy Bondarchuk's periodisation framework (Transfer of Training in Sports, 2007; Period of Development of Sports Form) as operationalised by Mike Tuchscherer's Emerging Strategies (RTS, ~2015) and the Evolve AI Genesis Engine. The core hypothesis is that individual biological adaptation — measured as e1RM progression — does not unfold on a universal timeline, and that the most efficient path to a performance peak is to apply a fixed stimulus and observe the athlete's specific response, rather than to prescribe fixed macrocycle lengths.

**State of the evidence:** Direct RCT evidence for this specific methodology in resistance-trained populations is sparse. Block periodisation and DUP produce broadly equivalent strength outcomes in available meta-analyses (Williams et al., 2017; Painter et al., 2012) [VALIDATED for generic block periodisation]. The specific claim that repeated-microcycle tracking produces superior outcomes to progressive variation has not been tested in a peer-reviewed RCT in powerlifters [HEURISTIC — presented as such to users]. The primary justification for the approach is not superiority over alternatives, but *information value*: holding training variables constant isolates the biological signal in the e1RM data.

#### 4.4.2 Development Block Structure

A Development Block in Forge consists of:

1. **A fixed microcycle template** (one week of training): specific exercises, target rep ranges, target RPE bands, and fatigue protocol parameters. The template is held strictly constant across repeated exposures.
2. **Repeated exposures**: the microcycle is repeated each week. Between weeks, only the *load* changes (auto-calculated to hit target RPE); all other variables are fixed.
3. **A peak detection trigger**: the system monitors the user's rolling e1RM. When the rolling e1RM has declined for two consecutive weeks after a peak (or has been flat for three consecutive weeks after an initial rise), the Development Block is considered complete and a Deload/Pivot is initiated.

A Development Block typically runs 4–12 weeks, depending on the user's Time-to-Peak (see §6.6). The system does not impose a fixed length — it observes the data and responds.

#### 4.4.3 Time-to-Peak (TTP)

Time-to-Peak is the number of weekly exposures to a specific Development Block that an athlete requires before their rolling e1RM reaches its maximum and begins to regress. This is a user-specific parameter that the system learns over repeated blocks.

**Evidence basis:** TTP as a quantitative construct derives from Bondarchuk's observational coaching records, which reported three response-type patterns (3–4 week peaks, 5–8 week peaks, 9–12 week peaks) in throwing athletes [HEURISTIC — not RCT-validated in powerlifters]. The system treats TTP as a learned, provisional estimate that is updated with each completed block, not as a known biological constant. The initial TTP estimate is derived from the user's training age (proxy for adaptation speed):

| Training Age | Initial TTP Estimate |
|---|---|
| 1–2 years (trained) | 4–5 weeks |
| 3–5 years (intermediate) | 5–7 weeks |
| 6–10 years (advanced) | 7–10 weeks |
| >10 years (elite) | 8–12 weeks |

After the first two completed blocks, the system replaces the training-age-based estimate with the user's actual observed TTP history.

**Confirmation gate on TTP updates.** A single observed peak that disagrees with the current estimate is not enough to shift TTP — it could be caused by acute illness, poor sleep, or a sandbagged session rather than a durable change in adaptation speed. To buffer against this noise, off-target peaks are first held as a **pending candidate**:

1. The peak week is appended to `ttp_history` (so the chart shows the raw observation).
2. If the candidate matches the current estimate (within ±0.5 wk), it is ignored — any existing pending candidate is discarded.
3. If it is the first off-target peak, it is stored as `ttp_pending_peak` and the estimate is unchanged.
4. If a second consecutive off-target peak arrives in the **same direction** (both earlier or both later than the estimate) and **within ±1 week** of the first candidate, the gate fires: the EWMA (α = 0.4) is applied to both observations in sequence and the estimate is updated. The candidate is then cleared.
5. If the second observation contradicts the candidate (different direction or jumps >1 wk), both candidates are discarded — the estimate stays put and the new observation becomes the next pending candidate.

Each transition is logged to the block's audit log (`TTP_CANDIDATE_RECORDED`, `TTP_ESTIMATE_UPDATED`, `TTP_CANDIDATE_CLEARED`, `TTP_CANDIDATE_REPLACED`) so the user can see why the estimate did or did not move.

### 4.5 Intra-Session Volume Autoregulation [VALIDATED by extension from VBT literature]

The system regulates the volume of back-off work within a session using a performance-drop termination protocol. This is the application layer of the velocity-loss (VL) research tradition (Pareja-Blanco et al., 2017, 2020; Sánchez-Medina & González-Badillo, 2011) to an RPE-based, non-VBT context.

#### 4.5.1 Three Drop Protocols

**Load Drop Protocol (primary for hypertrophy/accumulation phases):**
1. User completes a top set (e.g., 4 reps @ RPE 8).
2. System calculates back-off load = top-set load × (1 − drop_percentage/100).
3. User performs back-off sets at the reduced load until the RPE climbs back to the top-set RPE.
4. The number of sets required to reach the termination RPE is recorded as the session fatigue volume.

*Drop percentage targets by phase:*

| Mesocycle Phase | Drop Target | Physiological Rationale |
|---|---|---|
| Accumulation (hypertrophy emphasis) | 10–15% | Higher volume, structural fatigue, hypertrophic stimulus (analogous to 20–40% VL) |
| Intensification (strength emphasis) | 5–8% | Moderate volume, high quality, neuromuscular focus (analogous to 10–20% VL) |
| Realisation/Peaking | 2–5% | Minimal back-off, high specificity, CNS freshness |

These targets are consistent with the inverted-U dose-response finding of Pareja-Blanco et al. (2020): low VL/drop percentages produce superior strength/power outcomes; high VL/drop percentages produce superior hypertrophy but impair short-term recovery. [VALIDATED in direction; specific percentage thresholds are [HEURISTIC]]

**Rep Drop Protocol (primary for strength/peaking phases):**
1. User completes a top set at the prescribed load.
2. Subsequent sets use the same load but reduce reps by 1 each set.
3. Sets continue until the RPE matches the top-set RPE.

**Repeat Protocol (for work-capacity and technical endurance):**
1. User repeats the exact top set (same load, same reps) until the RPE climbs to a predetermined ceiling (e.g., top-set RPE + 0.5).
2. Typically used during mid-block competition-lift technique work.

#### 4.5.2 Benchmark Set

At the beginning of each session, before back-off work, the system may prescribe a Benchmark Set: a single or triple at a prescribed RPE (e.g., a single @ RPE 8 for the primary lift). The benchmark set's load vs. the system's projected load-at-RPE serves as an **in-session readiness calibrator**. If the actual load is:

- **≥ 5% higher than projected:** session readiness is elevated. The system scales up back-off load targets by 2–3%.
- **Within ±5% of projected:** normal session. No adjustment.
- **≥ 5% lower than projected:** session readiness is reduced. The system scales down back-off load targets by 3–5% and reduces the drop-protocol termination RPE by 0.5 points (less volume).

The benchmark adjustment is blended with the Readiness Composite Score (§6.3) to produce the final session prescription.

### 4.6 Volume Landmarks: MEV, MAV, MRV [HEURISTIC, consistent with meta-analytic evidence]

#### 4.6.1 Framework Overview

Forge uses the Minimum Effective Volume (MEV), Maximum Adaptive Volume (MAV), and Maximum Recoverable Volume (MRV) framework as a *qualitative guideline and starting estimate* for weekly set targets per muscle group. This framework was developed by Mike Israetel and colleagues at Renaissance Periodization and is consistent with the broad shape of the dose-response evidence for hypertrophy (Schoenfeld et al., 2017; Pelland et al., 2024–25).

**Critical declaration:** The specific numerical landmarks in this framework (e.g., "MEV for quads = 8 sets/week; MRV = 20 sets/week") are **coaching heuristics, not empirically measured thresholds** [HEURISTIC]. The dose-response curve for both hypertrophy and strength is continuous, not stepped — there is no inflection point in the data that validates a discrete "MEV" number. The system uses these as probabilistic starting estimates, not hard-coded rules.

#### 4.6.2 Volume-Landmark Definitions

- **MEV (Minimum Effective Volume):** The minimum weekly hard-set volume per muscle group below which the training stimulus is insufficient to drive measurable adaptation in a given training block. Initial estimates derived from training age and the Schoenfeld/Israetel framework; updated by performance trends.
- **MAV (Maximum Adaptive Volume):** The volume range in which the adaptation signal is strongest relative to fatigue cost — the "sweet spot." MAV is a range (not a point) centred roughly halfway between MEV and MRV.
- **MRV (Maximum Recoverable Volume):** The weekly volume ceiling above which the user's recovery capacity is exceeded and performance begins to decline despite continued loading. Identified retrospectively from performance regression data.

#### 4.6.3 System Behaviour with Volume Landmarks

The system begins each Development Block at MEV (conservative) and progressively increases weekly volume across exposures (within the fixed microcycle template, this is done by adding sets or adjusting drop-protocol targets). The rate of weekly volume increase defaults to one additional hard set per muscle group per week — a conservative approach to managing MRV risk. If performance data suggests the user is well below their MRV (high readiness scores, no performance regression), the system may accelerate the volume ramp. If performance data suggests MRV proximity (rising RPE drift, declining e1RM, poor wellness scores), volume is capped or reduced.

The system **never automatically increases volume to MRV-level targets** without the user confirming they understand the higher fatigue cost. MRV-adjacent volume is a user-confirmed choice, not an automated default.

#### 4.6.4 Evidence Note

The Pelland et al. (2024–25) meta-regression confirms that hypertrophy continues to increase with volume up to and beyond 20 sets/week per muscle group, with diminishing efficiency in the 19–29 set range. Schoenfeld et al. (2019) found significantly greater hypertrophy at 20 vs 10 sets/week but no additional strength benefit. Buckner et al. (2023) raised concerns about the underpowered nature of direct volume comparisons in trained individuals. The system therefore treats high-volume prescriptions (>20 sets/week per muscle group) with caution and requires explicit user intent to deploy them.

### 4.7 Cumulative Load Tracking: The Session Fatigue Index [PROPRIETARY]

#### 4.7.1 Validated Components

To quantify weekly training load for fatigue management, the system uses two validated methods in parallel:

**Session-RPE Load (sRPE × duration):** Proposed by Foster et al. (2001) and validated across 36+ studies (Haddad et al., 2017). Calculated as:

```
sRPE_Load = CR10_session_RPE × session_duration_minutes
```

Where `CR10_session_RPE` is the user's global post-session RPE rating on the 0–10 CR-10 scale (collected via a post-session prompt: "How hard was the overall session?"). This is the most widely validated training load metric in the resistance training literature [VALIDATED]. It is surfaced directly to the user and used as a reference metric in the Block Review.

**Volume Load:** External training load calculated as:

```
Volume_Load = Σ(sets × reps × load)  [per session, per week]
```

This is a standard metric widely used in periodisation research [VALIDATED].

#### 4.7.2 The Session Fatigue Index (SFI) — Proprietary Heuristic

The validated metrics above do not adequately differentiate between, for example, 5 × 5 @ RPE 8 on a back squat versus 5 × 5 @ RPE 8 on a leg press — exercises with dramatically different systemic recovery demands. To address this, the system also computes a proprietary **Session Fatigue Index (SFI)** that incorporates exercise-specific loading factors.

**This metric is PROPRIETARY [PROPRIETARY] and is not validated in peer-reviewed literature. It must be presented to users as an internal system heuristic, not a scientific measurement.**

The formula is:

```
SFI = Σ over all sets in session:
        [ (RPE²/81) × Reps^0.65 × EFC × Proximity_Factor ]

Where:
  RPE²/81         — Quadratic RPE weighting (normalised so RPE 9 = 1.0)
                    Reflects that fatigue scales nonlinearly with effort proximity
  Reps^0.65       — Sub-linear rep-count scaling
                    Reflects that fatigue does not double as reps double (metabolic
                    disruption scales at roughly the 0.65 power)
  EFC             — Exercise Fatigue Coefficient: a per-exercise systemic demand multiplier
                    (see §4.7.3)
  Proximity_Factor — 1.0 for back-off sets; 1.2 for top-set/benchmark sets
                    (highest proximity to failure is disproportionately costly)
```

The exponents (RPE²/81, Reps^0.65) and the EFC structure are internally reasoned based on the recovery-time literature (Morán-Navarro et al., 2017 — showing differential recovery trajectories between squat and bench press; Pareja-Blanco et al., 2020 — showing nonlinear fatigue accumulation with VL) [HEURISTIC derivation from VALIDATED literature]. They have not been independently validated. The system will internally validate the SFI against user-reported recovery (wellness scores the morning after training) and adjust coefficients over time.

#### 4.7.3 Exercise Fatigue Coefficients (EFC)

The EFC is a per-exercise systemic demand multiplier. No peer-reviewed validation exists for specific numerical coefficients; these are expert-consensus estimates informed by recovery-time research [HEURISTIC]. The system ships with a default EFC table (below) that the user and system can refine based on personal recovery data.

| Exercise Category | Example Exercises | Default EFC |
|---|---|---|
| High axial + full-body compound | Barbell Back Squat, Front Squat, Zercher Squat | 1.40 |
| High posterior chain compound | Conventional Deadlift, Sumo Deadlift, Trap Bar Deadlift | 1.35 |
| Moderate posterior chain | Romanian Deadlift, Good Morning, Snatch-Grip DL | 1.25 |
| Upper body compound, heavy | Close-Grip Bench Press, Overhead Press | 1.00 |
| Primary upper body compound | Bench Press, Incline Press | 0.95 |
| Moderate compound | Barbell Row, Dumbbell Row, Pull-up | 0.85 |
| Light compound / machine | Leg Press, Hack Squat, Cable Row | 0.75 |
| Isolation — upper body | Dumbbell Curl, Tricep Extension, Lateral Raise | 0.55 |
| Isolation — lower body | Leg Curl, Leg Extension, Calf Raise | 0.50 |
| Remedial / light accessory | Banded work, face pulls, light core | 0.30 |

**User and system EFC adjustment:** After each block, the system cross-correlates each exercise's SFI contribution against the user's next-morning wellness scores. If an exercise's actual recovery cost consistently deviates from its EFC-predicted cost, the system proposes an EFC adjustment for that user. The user approves the change.

#### 4.7.4 Acute:Chronic Load Ratio (ACLR)

The system computes an EWMA-based ACLR (Williams et al. 2017) over daily session sRPE-load, falling back to SFI when sRPE was not logged:

```
λ_acute   = 2/(7+1)  = 0.25     (7-day half-life)
λ_chronic = 2/(28+1) ≈ 0.069    (28-day half-life)
ewma_t    = λ * load_t + (1 - λ) * ewma_{t-1}
ACLR      = ewma_acute / ewma_chronic
```

Days without sessions contribute load = 0 (decay continues). For the first 14 days of training history the chronic baseline is insufficient and the ratio is shown as "calibrating" rather than as a value — this prevents spurious warnings during the first two weeks.

Based on Gabbett (2016) and Williams et al. (2017) "Better way to determine the acute:chronic workload ratio?" The EWMA formulation explicitly addresses the mathematical coupling and phase-transition artifacts that affect simple week-over-week and rolling-window ratios (Impellizzeri et al., 2020; Lolli et al., 2019). **Important caveat:** ACLR's injury-prediction validity remains contested in team sports and is untested in strength sports specifically [VALIDATED — contested]. The system uses the ACLR as a **qualitative warning indicator** only: an ACLR > 1.5 triggers a yellow flag encouraging the user to monitor recovery carefully. It does not automatically modify the programme. It is not presented to the user as a validated injury-risk score.

### 4.8 Daily Readiness & Wellness Monitoring [VALIDATED]

#### 4.8.1 Pre-Session Wellness Questionnaire

Supported by Saw, Main & Gastin (2016) systematic review (56 studies — the most comprehensive review in this area), which concluded that **subjective wellness self-report measures demonstrate superior sensitivity and consistency in reflecting training-load responses compared to most objective measures** including HRV [VALIDATED]. The pre-session questionnaire is therefore the primary readiness signal in the system.

The questionnaire uses five validated dimensions from McLean et al. (2010) and the Hooper Index:

| Item | Scale | What It Measures |
|---|---|---|
| Sleep quality | 1 (very poor) – 10 (excellent) | Central nervous system recovery, readiness for high-effort work |
| Overall fatigue | 1 (extremely fatigued) – 10 (fully energised) | Systemic readiness |
| Muscle soreness | 1 (severe, limiting) – 10 (none) | Peripheral recovery, injury risk |
| Mood/motivation | 1 (very poor) – 10 (highly motivated) | Psychological readiness |
| Stress (non-training) | 1 (extremely stressed) – 10 (none) | CNS and recovery budget impact |

**Administration:** Presented immediately before the session begins. Must be completed before the session prescription is finalised. Responses are logged with a timestamp. If the user skips the questionnaire, the system uses the most recent valid entry with reduced confidence weighting.

**Special flags — automatic programme modification:**

| Flag Condition | System Response |
|---|---|
| Localized muscle soreness ≤ 3 on a primary lift's agonist group | System proposes swapping that movement for a lower-fatigue variant; user confirms |
| Overall fatigue ≤ 4 | Session volume is reduced by 10–20%; RPE targets drop by 0.5 points; user is prompted to consider a reactive deload |
| Fatigue ≤ 3 AND soreness ≤ 3 simultaneously | System recommends skipping the session or performing a light technique session only |

#### 4.8.2 Heart Rate Variability (HRV) Integration [VALIDATED — with limitations]

HRV (specifically rMSSD from morning-measured, 3–5 minute resting recordings) is supported as a training-load monitoring tool, with important caveats. Plews et al. (2013) established that a 7-day rolling mean rMSSD, expressed as a coefficient of variation from the athlete's baseline, is the most reliable HRV metric for detecting accumulated fatigue. Single-day HRV readings are noisy and confounded by hydration, sleep position, alcohol, and respiration rate [VALIDATED — strong limitation applies].

**System implementation:** HRV data is accepted as an optional third-party input (via Health Connect / Apple Health integration or manual entry). The system uses HRV as a **trend-level signal only**, not as a day-to-day go/no-go indicator:

- **Rolling 7-day rMSSD > 5% below the user's 28-day baseline:** chronic fatigue flag — system notes elevated cumulative load in the Block Review and will suggest a deload check-in at the next session
- **Rolling 7-day rMSSD > 10% below the 28-day baseline:** system adds an explicit recommendation to accelerate the deload trigger evaluation

HRV is never the sole basis for modifying a session prescription. It is always evaluated in conjunction with the subjective wellness score.

#### 4.8.3 Readiness Composite Score (RCS)

The system computes a single-number Readiness Composite Score (0–100) from the pre-session wellness inputs. See §6.3 for the full algorithm. The RCS drives the session modifier applied to the standard prescription.

### 4.9 Weak Point Analysis [HEURISTIC implementation of VALIDATED concepts]

#### 4.9.1 Theoretical Basis

The concept of diagnosing a strength failure's location (which muscle group or joint angle is the limiting factor) is established in sports science, particularly through the work of Kompf & Arandjelović (2016, 2017) on sticking-point mechanics, Beckham et al. (2018) on deadlift biomechanics, and the broader literature on neuromuscular adaptations to strength training (Folland & Williams, 2007; Aagaard et al., 2002) [VALIDATED concepts].

The source documents' framing of strength limitations as cleanly "muscle-centric" (cross-sectional area insufficient) versus "nervous-system-centric" (motor unit recruitment insufficient) is an **oversimplification not supported by modern research** [VALIDATED — known limitation]. These mechanisms are continuous and overlapping, and cannot be cleanly separated without laboratory equipment (twitch interpolation, EMG, dynamometry). The system therefore avoids the "muscle vs nervous system" diagnostic framing and instead implements a **variation-responsiveness approach** — the evidence-based method available without laboratory equipment (Kompf & Arandjelović, 2017; Nuckols, Greg — Stronger by Science synthesis) [HEURISTIC with VALIDATED rationale].

#### 4.9.2 Weak Point Identification Methods

The system uses three data sources to identify weak points:

**1. Failure pattern analysis (onboarding + ongoing):**
The user is asked at onboarding to characterise their pattern of failure in each primary lift at maximal loads. For each lift, a branching questionnaire maps reported failure position to likely limiting factors:

*Squat failures:*
- Fails out of the hole (below parallel) → likely hip extensor (glute/hip) weakness or excessive hip shift
- Good descent but loses thoracic position at the bottom → thoracic extension or anterior core weakness
- Bends forward excessively on ascent (good morning) → hip extensor weakness relative to quadriceps
- Fails mid-ascent (sticking point) → quadricep/knee extensor contribution limit
- Falls forward on the ascent → posterior chain or bracing deficiency

*Bench press failures:*
- Fails off the chest (cannot complete transition) → pec/anterior delt or lat stability weakness
- Fails mid-range (classic sticking region) → mechanical disadvantage zone; anterior delt, tricep contribution
- Fails at lockout → tricep weakness; common in raw lifters with longer arms

*Deadlift failures:*
- Cannot break floor / immediate back rounding → weak erectors, lat engagement, or hip extensor relative to low back
- Bar breaks floor but stalls at knee → quad weakness, bar path deviation, or hip hinge timing
- Bar clears knee but fails at lockout → hip extensor, glute, or general posterior chain fatigue

**2. Accessory exercise responsiveness (ongoing):**
Over repeated blocks, the system tracks correlations between which accessory exercises were emphasised and which blocks produced the best primary lift e1RM gains. Consistently positive correlations between a specific accessory and primary lift performance suggest the accessory is addressing a genuine limiting factor. [HEURISTIC — small-N correlations within a user; treated as provisional signals requiring multiple-block confirmation]

**3. Variation delta testing (planned):**
For advanced users, the system can prescribe targeted variation tests: e.g., a block with heavy pause squats vs a block without, comparing the primary lift e1RM response. A larger response to the paused variation implies the sticking region identified by the pause is the limiting factor. [HEURISTIC — direct application of the diagnostic variation methodology described by Nuckols and Tuchscherer]

#### 4.9.3 Accessory Programming from Weak Point Data

Once a probable weak point is identified, the system adjusts the accessory and supplemental programming accordingly:

| Weak Point | Primary Accessory Emphasis | Supplemental Emphasis |
|---|---|---|
| Squat — out of the hole | Paused squat (2–3 count), box squat | Romanian Deadlift, Glute Bridge, Hip Thrust |
| Squat — back position loss | Front Squat, Safety Bar Squat | Thoracic extension work, Plank variations |
| Squat — mid-ascent stall | High-bar squat, heel-elevated squat | Leg Press, Hack Squat, Bulgarian Split Squat |
| Bench — off the chest | Paused bench (2–3 count), close-grip bench | Dumbbell flat/incline, Cable fly |
| Bench — mid-range stall | Board press, floor press | Overhead Tricep Extension, Skullcrusher |
| Bench — lockout | Spoto press, partial ROM work | Weighted Dip, Lockout-focused extensions |
| Deadlift — off the floor | Deficit deadlift, paused at shin | Romanian DL, Good Morning |
| Deadlift — knee stall | Paused below knee, block pulls | Leg Press, Leg Curl |
| Deadlift — lockout | Rack pull from sticking point | Hip Thrust, Good Morning |

### 4.10 Deload & Pivot Block Theory [VALIDATED with important caveats]

#### 4.10.1 Evidence Summary

The direct RCT evidence on deloads in resistance training is surprisingly thin and partially contradictory. **Coleman et al. (2024, PeerJ)** — the only direct RCT comparing a mid-mesocycle deload against continuous training in strength athletes — found that a 1-week complete cessation deload **did not improve hypertrophy or readiness** and **significantly reduced strength gains** compared to continuous training [VALIDATED — contradicts common coaching wisdom].

Pre-competition tapering research (Bosquet et al., 2007) found small but significant performance benefits from 1–2 week tapers with ~40–60% volume reduction at maintained intensity. Strength does not significantly decline within 5–7 days of cessation in trained individuals (Ogasawara et al., 2013) but begins to deteriorate meaningfully beyond 2–3 weeks [VALIDATED].

Expert coaching practice (Bell et al., 2022 qualitative study of strength/physique coaches) views deloads primarily as **fatigue and injury risk management tools**, not adaptation enhancement tools — a framing consistent with the Coleman et al. finding [VALIDATED — qualitative evidence].

#### 4.10.2 System Deload Policy

Based on this evidence, Forge departs from the claim that deloads enhance adaptation. Instead:

- Deloads are framed as **fatigue management and injury risk reduction** tools
- The default deload structure is a 1-week **active deload**: ~50% volume reduction at maintained intensity (technique-focused work at RPE 6–7). Complete cessation is not the default and requires explicit user selection.
- Deloads are **reactive** (triggered by performance, readiness, and fatigue signals — see §6.8) rather than fixed-schedule
- The system tracks whether the user's post-deload e1RM is higher, lower, or equal to the pre-deload e1RM and uses this data to refine future deload timing for that user

#### 4.10.3 Pivot Blocks

A Pivot Block is a 1–3 week phase introduced after a completed Development Block (post-peak) that uses substantially different exercises, altered rep ranges, and novel stimuli. The rationale is twofold: (1) acute recovery from competition-lift specific neural and connective tissue stress, and (2) restoration of sensitivity to the heavy barbell stimulus before the next Development Block.

**Evidence basis:** No peer-reviewed RCT compares pivot blocks to traditional deloads [HEURISTIC]. The rationale draws from the broader periodisation literature showing that sustained monotony of stimulus leads to diminished returns (the "principle of accommodation," broadly accepted in periodisation theory), and from Bondarchuk's variation-method framework [HEURISTIC]. The pivot block is presented to users as a sensible but unproven approach to re-sensitisation, not as an evidence-verified superiority claim.

Default Pivot Block structure:
- Duration: 1 week (short) to maximum one-third of the preceding Development Block's duration [HEURISTIC from Tuchscherer]
- Exercises: no primary competition lifts in their standard form; emphasise variation movements (pauses, tempo work, unilateral variations)
- Rep ranges: shift to higher reps (8–15) for primary movements
- Intensity: RPE 6–8 cap; no top sets above RPE 8

### 4.11 VBT Integration [VALIDATED — optional module]

Velocity-Based Training (VBT) is supported as an optional precision layer. Evidence strongly supports VBT's validity for load prescription and intra-session fatigue monitoring (González-Badillo & Sánchez-Medina, 2010; Pareja-Blanco et al., 2017; Banyard et al., 2017) [VALIDATED].

VBT and RPE are complementary, not competing, modalities. Their correlation is strong at the group level (r = −0.87 in Helms et al., 2017) but individual variability is substantial, making them jointly more informative than either alone [VALIDATED].

**When VBT is available, the system uses it to:**
1. Calibrate the user's personal RPE-to-velocity profile (improving e1RM accuracy)
2. Provide an objective intra-session fatigue signal (velocity loss % across a set)
3. Flag RPE miscalibration in real time ("Your velocity suggests this was closer to RPE 9, not 8 — would you like to adjust?")

**Supported VBT inputs:** GymAware, Tendo Unit, PUSH Band, Vitruve, RepOne (via Bluetooth export), or smartphone-based video velocity estimation (future phase). All device integrations use a standard linear velocity input (mean propulsive velocity in m/s).

---

## 5. Expert System Architecture

### 5.1 Architecture Choice: Rules-Based Expert System

Forge's training engine is a **rules-based expert system** — not a machine learning model. This is a deliberate, evidence-driven design choice.

A machine learning ("black box") model trained on historical training logs might find hidden correlations and make recommendations that appear useful — but the reasoning is opaque. In a domain where coach-athlete trust, biological rationale, and long-term adherence are paramount, opacity is a design flaw. If the system prescribes an unusual volume increase, the athlete must be able to understand *why* or they will override the system and lose confidence in it.

An expert system makes decisions through an explicit, auditable inference chain:

```
Rule: IF rolling_e1RM declined for 2 consecutive weeks
       AND current_block_exposure > minimum_TTP_estimate
      THEN trigger = peak_detected → initiate deload evaluation
```

Every prescription can be traced to a specific rule, and every rule can be mapped to a specific section of this PRD and its evidence basis. This is the "transparent autoregulation" principle.

### 5.2 Engine Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         FORGE ENGINE                            │
│                                                                 │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │  READINESS  │   │   SESSION    │   │    BLOCK STATE     │  │
│  │  EVALUATOR  │──▶│  GENERATOR   │──▶│    MANAGER         │  │
│  └─────────────┘   └──────────────┘   └────────────────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐  │
│  │   WELLNESS  │   │   e1RM       │   │  PEAK DETECTOR /   │  │
│  │   SCORING   │   │  ENSEMBLE    │   │  TTP TRACKER       │  │
│  └─────────────┘   └──────────────┘   └────────────────────┘  │
│                                                 │              │
│                          ┌──────────────────────┘              │
│                          ▼                                      │
│                 ┌─────────────────────┐                        │
│                 │  PROGRAMME PLANNER  │                        │
│                 │  (Block generator,  │                        │
│                 │  Exercise selector, │                        │
│                 │  Volume budgeter)   │                        │
│                 └─────────────────────┘                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │   WEAK POINT ENGINE   │   DELOAD EVALUATOR   │   AUDIT  │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Readiness Evaluator:** Ingests pre-session wellness questionnaire, HRV trend (optional), and benchmark set result. Outputs the Readiness Composite Score (0–100).

**Session Generator:** Takes the current microcycle template, the Readiness Composite Score, the current block phase, and the user's volume budget, and produces the session prescription (exercises, load targets, rep targets, RPE targets, drop protocol parameters).

**e1RM Ensemble:** Continuously updates the session and rolling e1RM for each primary lift using the multi-method ensemble (§6.1).

**Block State Manager:** Tracks block exposure count, rolling e1RM trend, SFI accumulation, and block phase. Governs transitions between Accumulation, Intensification, Realisation, and Deload/Pivot phases.

**Peak Detector / TTP Tracker:** Monitors the rolling e1RM curve for peak and regression patterns. Maintains per-user TTP history and triggers block-end evaluation.

**Programme Planner:** Generates the initial microcycle template for a new Development Block based on the user's goals, training history, weak-point data, and volume landmarks.

**Weak Point Engine:** Maintains the user's weak-point profile, selects appropriate accessory and supplemental exercises, and tracks variation-responsiveness correlations across blocks.

**Deload Evaluator:** Applies multi-signal deload trigger logic (§6.8) and, when triggered, structures the deload or pivot prescription.

**Audit Module:** Records a full decision trail for every rule fired. Every prescription change is attributable to a specific rule and accessible in the Block Review.

### 5.3 Session State Machine

Each session exists in one of the following states, progressing sequentially:

```
SCHEDULED → WELLNESS_PENDING → BENCHMARK_PENDING → IN_SESSION
→ [TOP_SET_PENDING → BACK_OFF_PENDING] × N exercises
→ SESSION_COMPLETE → REVIEW_PENDING → LOGGED
```

State transitions trigger engine re-evaluation: wellness completion triggers RCS calculation; benchmark set completion triggers session-level load recalibration; session completion triggers e1RM update and SFI addition.

---

## 6. Algorithm Specifications

This section provides the full algorithmic specification for each major computation in the Forge engine. All algorithms must be implemented exactly as specified. Any deviation requires a change to this document and a corresponding evidence justification.

### 6.1 e1RM Ensemble Algorithm

**Inputs per set:**
- `load` (kg or lbs — system stores in kg internally)
- `reps` (integer, completed reps)
- `rpe` (float, 5.0–10.0 in 0.5 increments)
- `exercise_id` (links to the exercise database for movement-specific table lookups)
- `velocity` (float, mean propulsive velocity in m/s — optional, only when VBT hardware present)

**Step 1 — Rep-based estimate:**
```
epley    = load × (1 + reps / 30)
brzycki  = load / (1.0278 − 0.0278 × reps)  [only valid when reps < 37]
rep_e1rm = (epley + brzycki) / 2

rep_confidence = CASE
  WHEN reps <= 3 AND rpe >= 8.0 THEN 1.0
  WHEN reps <= 5 AND rpe >= 7.5 THEN 0.9
  WHEN reps <= 8 AND rpe >= 7.0 THEN 0.7
  WHEN reps <= 10              THEN 0.5
  ELSE 0.2
END
```

**Step 2 — RPE-adjusted estimate:**
```
rpe_pct = user_rpe_table_lookup(exercise_type, reps, rpe)
  // Returns the % of 1RM corresponding to this reps×RPE combination
  // Initially populated from the Tuchscherer/Helms population-average table
  // Continuously updated from the user's own performance history

rpe_e1rm = load / rpe_pct

rpe_confidence = CASE
  WHEN user.rpe_calibration_sessions >= 20 AND user.rpe_mae <= 0.5 THEN 1.0
  WHEN user.rpe_calibration_sessions >= 10                         THEN 0.7
  WHEN user.training_age_years >= 2                                THEN 0.5
  ELSE 0.3
END
```

**Step 3 — Velocity-based estimate (if hardware present):**
```
IF velocity IS NOT NULL AND user.lv_profile_n >= 10:
  vbt_e1rm = load / (user.lv_slope × velocity + user.lv_intercept)
  vbt_confidence = MIN(1.2, 0.8 + (user.lv_profile_n - 10) × 0.02)
ELSE:
  vbt_e1rm = NULL
  vbt_confidence = 0
```

**Step 4 — Ensemble calculation:**
```
total_weight = rep_confidence + rpe_confidence + (vbt_confidence IF vbt_e1rm NOT NULL)
e1rm_session = (rep_e1rm × rep_confidence + rpe_e1rm × rpe_confidence
                + (vbt_e1rm × vbt_confidence IF applicable)) / total_weight
```

**Step 5 — Rolling e1RM update:**
```
α = 0.30  // Default EWMA decay; user-configurable 0.2–0.5
e1rm_rolling = α × e1rm_session + (1 − α) × e1rm_rolling_previous
```

**Step 6 — Confidence interval:**
```
method_variance = weighted_std_dev(available_methods_estimates, confidence_weights)
ci_95_pct = method_variance / e1rm_ensemble × 1.96 × 100
Display: "{e1rm_session:.1f} kg (±{ci_95_pct:.0f}%)"
```

### 6.2 Session Fatigue Index (SFI) Calculation

**For each set in the session:**
```
set_sfi = (rpe / 9)² × reps^0.65 × efc(exercise_id) × proximity_factor

WHERE:
  proximity_factor = 1.2 if is_top_set ELSE 1.0
  efc(exercise_id) = lookup from EFC table (§4.7.3) or user-personalised value
```

**Session total:**
```
sfi_session = Σ set_sfi for all sets in session
```

**Weekly cumulative:**
```
sfi_week = Σ sfi_session for all sessions in week
```

**EWMA ACLR (warning only, Williams et al. 2017):**
```
// Per-day input: srpe_load if logged, else sfi_session (fallback). Missing days = 0.
λ_acute   = 2 / (7  + 1)  = 0.25
λ_chronic = 2 / (28 + 1) ≈ 0.069

ewma_acute_t   = λ_acute   * load_t + (1 - λ_acute)   * ewma_acute_{t-1}
ewma_chronic_t = λ_chronic * load_t + (1 - λ_chronic) * ewma_chronic_{t-1}

aclr = ewma_acute / ewma_chronic   // flag if > 1.5
calibrating = total_days_of_history < 14   // suppress ratio while chronic baseline immature
```

### 6.3 Readiness Composite Score (RCS) Algorithm

The RCS is computed before each session from the wellness questionnaire (WQ) and optionally from HRV trend data.

**Step 1 — Wellness score (primary signal):**
```
wq_raw = weighted_mean(
  sleep_quality    × 1.20,  // Highest weight — strongly predicts readiness
  overall_fatigue  × 1.15,
  muscle_soreness  × 1.00,
  motivation       × 0.85,
  stress           × 0.80
)
// wq_raw is on a 1–10 scale
wq_normalised = (wq_raw − 1) / 9 × 100  // Converts to 0–100
```

**Step 2 — HRV trend modifier (if available):**
```
IF hrv_7day_rolling IS AVAILABLE:
  hrv_deviation = (hrv_7day_rolling − user.hrv_28day_baseline) / user.hrv_28day_baseline
  hrv_modifier = CLIP(hrv_deviation × 20, −15, +10)
    // Max penalty: −15 RCS points; max bonus: +10 RCS points
    // Asymmetric: HRV can penalise more than it can reward (conservative)
ELSE:
  hrv_modifier = 0
```

**Step 3 — Trend modifier (from recent session data):**
```
// If last 3 sessions showed degrading RPE at matched loads, penalise
rpe_drift_3_sessions = trend_slope(session_rpe_at_equal_relative_load, last_3_sessions)
drift_penalty = CLIP(rpe_drift_3_sessions × 5, 0, 15)
  // Positive slope in RPE = increasing fatigue; up to −15 penalty
```

**Step 4 — Final RCS:**
```
rcs = CLIP(wq_normalised + hrv_modifier − drift_penalty, 0, 100)
```

**Step 5 — Session prescription modifier from RCS:**

| RCS Band | Interpretation | Session Modifier |
|---|---|---|
| 85–100 | Excellent readiness | Benchmark may allow +3% load bump; no volume reduction |
| 70–84 | Good readiness | Standard prescription; no modification |
| 55–69 | Moderate readiness | Drop target reduced by 1–2%; RPE cap reduced by 0.5 points |
| 40–54 | Poor readiness | Volume reduced 15–20%; RPE cap −1 point; user prompted to consider deload |
| <40 | Very poor readiness | System recommends deferring session; minimum recovery prescription if user insists |

### 6.4 Volume Autoregulation: Intra-Session Drop Protocol

**Inputs:** top-set load, top-set RPE, drop protocol type (load/rep/repeat), drop target percentage

**Load Drop Protocol execution:**
```
back_off_load = top_set_load × (1 − drop_target_pct / 100)
REPEAT:
  user performs 1 set at back_off_load for prescribed reps
  user inputs post-set RPE
  back_off_sets_completed++
  IF post_set_rpe >= top_set_rpe:
    BREAK  // Termination condition met
  IF back_off_sets_completed >= max_back_off_sets [default: 8]:
    BREAK  // Safety ceiling — prevents endless sets on excellent days
RECORD: back_off_sets_completed, total_set_volume
```

**Rep Drop Protocol execution:**
```
working_load = top_set_load
current_reps = top_set_reps - 1
REPEAT:
  user performs 1 set at working_load for current_reps
  user inputs post-set RPE
  current_reps--
  sets_completed++
  IF post_set_rpe >= top_set_rpe OR current_reps < 1:
    BREAK
RECORD: sets_completed, reps_completed
```

**Repeat Protocol execution:**
```
working_load = top_set_load
working_reps = top_set_reps
termination_rpe = top_set_rpe + 0.5  // Configurable; default +0.5
REPEAT:
  user performs 1 set at working_load × working_reps
  user inputs post-set RPE
  sets_completed++
  IF post_set_rpe >= termination_rpe OR sets_completed >= max_repeats [default: 6]:
    BREAK
```

**Dynamic drop-target selection by phase:**
```
IF block_phase == ACCUMULATION:
  load_drop_target = interpolate(10, 15, block_week / total_block_weeks)
ELIF block_phase == INTENSIFICATION:
  load_drop_target = interpolate(5, 8, block_week / total_block_weeks)
ELIF block_phase == REALISATION:
  load_drop_target = 2  // Minimal back-off, preserve CNS freshness
```

### 6.5 Weekly Volume Budget Algorithm

**Inputs per muscle group per week:**
- `current_mev_estimate` — current MEV estimate for this muscle group (sets/week)
- `current_mrv_estimate` — current MRV estimate
- `block_week` — current week in the Development Block (1-indexed)
- `total_block_weeks_estimate` — predicted length based on TTP
- `recovery_signal` — composite of last week's wellness scores and SFI

**Volume ramp:**
```
// Linear ramp from MEV toward MRV across the block
target_sets = mev + (mrv - mev) × (block_week / total_block_weeks_estimate)

// Recovery-based adjustment
IF recovery_signal < 60:   // Poor recovery last week
  target_sets = target_sets × 0.90  // Pull back 10%
ELIF recovery_signal > 80: // Excellent recovery last week
  target_sets = MIN(target_sets × 1.05, mrv × 0.95)  // Small bonus, never over 95% MRV

target_sets = ROUND(target_sets, 0)
```

**MRV personalisation:**
```
// After 3+ completed blocks, replace initial estimates with observed data
IF user.completed_blocks >= 3:
  // The week BEFORE performance began declining in each block = MRV proxy
  // MEV = the lowest volume week that produced measurable e1RM progress
  user.mrv_estimate = PERCENTILE(block_peak_week_volumes, 75)
  user.mev_estimate = PERCENTILE(productive_low_volume_weeks, 25)
```

### 6.6 Development Block & Time-to-Peak (TTP) Detection

**Rolling e1RM trend analysis:**
```
// Computed weekly, using the 3-session rolling e1RM of the primary lift
e1rm_trend = [e1rm_week_1, e1rm_week_2, ..., e1rm_week_N]

// Peak detection:
// A peak is confirmed when rolling e1RM has declined for 2 consecutive weeks
// after having risen for ≥ 2 weeks, AND block_week > minimum_ttp_estimate

is_peak_confirmed = (
  e1rm_trend[-1] < e1rm_trend[-2]          // Current week lower than last week
  AND e1rm_trend[-2] < e1rm_trend[-3]      // Last week lower than week before
  AND MAX(e1rm_trend) > e1rm_trend[0]      // A genuine rise occurred
  AND block_week >= minimum_ttp_estimate    // Not too early
)

// Stall detection (no progress for 3 weeks without prior rise):
is_stalled = (
  SLOPE(e1rm_trend[-3:]) ≈ 0
  AND MAX(e1rm_trend) ≤ e1rm_trend[0] × 1.01  // Less than 1% improvement
  AND block_week > 3
)
```

**TTP recording and updating (with confirmation gate):**
```
IF is_peak_confirmed:
  observed_peak = block_week - 2  // Peak was 2 weeks ago (confirmed retrospectively)
  user.ttp_history.append(observed_peak)

  // Confirmation gate — see §4.4.3. A single off-target peak does not move ttp_estimate;
  // it is held as a pending candidate. Two consecutive same-direction off-target peaks
  // (within ±1 wk of each other) are required before the EWMA update fires.

  on_target = |observed_peak - user.ttp_estimate| < 0.5

  IF on_target:
    user.ttp_pending_peak = NULL        // discard any candidate
  ELIF user.ttp_pending_peak IS NULL:
    user.ttp_pending_peak = observed_peak  // first off-target observation
  ELSE:
    prev = user.ttp_pending_peak
    same_direction = (prev < user.ttp_estimate AND observed_peak < user.ttp_estimate)
                  OR (prev > user.ttp_estimate AND observed_peak > user.ttp_estimate)
    consistent = |prev - observed_peak| <= 1
    IF same_direction AND consistent:
      // Apply EWMA across both observations in chronological order
      after_first = 0.4 * prev + 0.6 * user.ttp_estimate
      user.ttp_estimate = 0.4 * observed_peak + 0.6 * after_first
      user.ttp_pending_peak = NULL
    ELSE:
      // Inconsistent — discard old candidate, hold new one
      user.ttp_pending_peak = observed_peak

  // Trigger deload evaluation (see §6.8) regardless of whether the estimate moved
```

**Three response pattern classification (Bondarchuk) [HEURISTIC]:**
```
// After ≥ 2 blocks, classify the user's pattern for predictive use
pattern = classify_response_pattern(e1rm_trend_all_blocks)
  → CONSISTENT_PROGRESS: steady weekly gains; minimal intra-block dips
  → DIP_THEN_PROGRESS: week 2–3 dip followed by surge; common in more fatigued athletes
  → DELAYED_RESPONSE: slow initial progress, rapid late surge; typically longer TTP users
```

### 6.7 Weak Point Recommendation Engine

**Exercise selection logic:**
```
weak_points = user.weak_point_profile  // Set during onboarding, updated ongoing
block_phase = block_state_manager.current_phase
primary_lift = session.primary_lift

// Get base accessory template for primary lift
accessories = get_accessory_template(primary_lift, block_phase)

// Bias accessory selection toward weak-point exercises
FOR each exercise IN accessories:
  priority_score = base_priority(exercise, block_phase)
  IF exercise targets weak_points[primary_lift]:
    priority_score × = 1.5  // Increase selection weight for weak-point targeting
  IF user.accessory_responsiveness[exercise] > threshold:
    priority_score × = 1.3  // Exercise historically correlated with e1RM gains

ranked_accessories = SORT(accessories, BY priority_score DESC)
selected_accessories = ranked_accessories[:n_accessory_slots]
```

**Accessory responsiveness tracking:**
```
// At block end, correlate presence/absence/emphasis of each accessory with e1RM delta
FOR each accessory_id IN user.accessory_history:
  correlation = pearson_r(
    accessory_weekly_volume,    // Across 3+ blocks where the accessory featured
    primary_lift_e1rm_delta     // Week-over-week e1RM change in same block
  )
  IF abs(correlation) > 0.4 AND n_observations >= 6:  // Minimum data threshold
    user.accessory_responsiveness[accessory_id] = correlation
    // Surface to user: "Paused squats have consistently correlated with your squat gains"
```

### 6.8 Deload Trigger Algorithm

The deload trigger evaluates multiple signals and produces a recommendation, never an automatic programme change without user confirmation.

```
deload_signals = {
  peak_detected:       is_peak_confirmed OR is_stalled,         // Weight: 5
  wellness_sustained:  mean(rcs_last_3_sessions) < 60,          // Weight: 4
  rpe_drift:          rpe_drift_coefficient > 0.3,              // Weight: 3
  hrv_trend:          hrv_deviation < -0.10 IF available,       // Weight: 2
  aclr_flag:          aclr > 1.5,                               // Weight: 1
  joint_pain_flag:    user_reported_joint_pain == True,         // Weight: 5 (override)
  ttp_exceeded:       block_week > user.ttp_estimate × 1.3      // Weight: 4 (block too long)
}

deload_score = Σ(weight for each signal IF signal == True)

IF joint_pain_flag:
  → Immediate deload recommendation (regardless of score); prompt user to consult physio
ELIF deload_score >= 8:
  → Strong deload recommendation; surface prominent UI prompt
ELIF deload_score >= 5:
  → Moderate deload suggestion; note in session summary
ELIF deload_score >= 3:
  → Light advisory; add to block review notes
ELSE:
  → No action
```

**Deload structure selection:**
```
IF peak_detected:
  → Recommend Pivot Block (varied stimulus, RPE cap 8)
ELIF wellness_score sustained low OR joint_pain:
  → Recommend Active Deload (same movements, 50% volume, maintain intensity)
ELIF ttp_exceeded:
  → Recommend 1-week Active Deload then reassess block structure
DEFAULT:
  → Active Deload: 50% volume, maintained intensity, 1 week
```

### 6.9 Competition Peaking Scheduler

**Input:** competition date, user's confirmed TTP estimate, current block phase

**Algorithm:**
```
days_to_competition = competition_date - today
weeks_to_competition = days_to_competition / 7

// Backwards scheduling from competition day
final_taper_start = competition_date - 3  // Light final taper: 3 days pre-comp
realisation_block_end = competition_date - 7  // 1 week for final taper/realisation
realisation_block_start = realisation_block_end - 2  // 2-week realisation
pivot_block_end = realisation_block_start - 1
pivot_block_start = pivot_block_end - pivot_block_weeks  // Pivot block duration = TTP × 0.33
development_block_start = pivot_block_start - user.ttp_estimate  // TTP weeks development block

weeks_available = (competition_date - development_block_start) / 7

IF weeks_available > weeks_to_competition:
  → Alert: insufficient time for full TTP cycle; provide options:
    (a) Begin development block immediately and accept a partial cycle
    (b) Postpone competition
    (c) Skip pivot block and run development block → taper directly

IF weeks_available ≤ weeks_to_competition:
  → Generate peaking plan with exact dates
  → Highlight the development block start date in the calendar view
  → Lock development block phase once started to prevent mid-block deviations
```

---

## 7. Feature Specifications

### 7.1 Onboarding: Biometric & Baseline Assessment

Onboarding must be completable in ≤ 15 minutes. It establishes the initial parameters for all engine algorithms.

#### 7.1.1 Step 1 — Training Eligibility Check

```
Screen: "Before we get started, help us make sure Forge is right for you."
Questions:
  - "How long have you been consistently training with barbell movements?"
    [ Under 6 months | 6–12 months | 1–2 years | 2–5 years | 5+ years ]
  - "Are you currently under the care of a physiotherapist or medical professional
     for any strength-training-related injuries?"

Logic:
  IF training_age < 6 months:
    → Redirect to novice LP recommendation; do not proceed
  IF injury_flag == True:
    → Display medical disclaimer; require explicit acknowledgement before proceeding
```

#### 7.1.2 Step 2 — Biometric & Demographic Data

Required fields:
- Body weight (kg/lbs, user preference) — used for MEV/MRV initial estimates
- Date of birth — used for fatigue recovery rate adjustments (older athletes trend toward longer recovery)
- Biological sex — used for population-average volume landmark initialisation (not deterministic)
- Training age (years of consistent barbell training)
- Training frequency preference (days/week available for training)
- Primary goal: Competition Powerlifting | Strength Development | Hypertrophy | General Fitness

Optional:
- Current weight class (for competitive lifters)
- Next competition date

#### 7.1.3 Step 3 — Current Strength Baselines

For each primary lift (squat, bench press, deadlift):
- Current known 1RM, or
- Best recent working set (weight × reps × RPE) for e1RM calculation

Additional stance/technical data (influences accessory programming defaults):
- Squat stance: narrow/moderate/wide/sumo (if included)
- Deadlift stance: conventional/sumo/mixed
- Use of belt: yes/no
- Use of knee sleeves/wraps: sleeves/wraps/raw

#### 7.1.4 Step 4 — Weak Point Diagnostics

For each primary lift, a branching questionnaire identifies probable limiting positions (§4.9.2). The user can skip if they have no clear failure pattern (early in their training career). Skipped data defaults to balanced accessory programming.

Additionally:
- "At approximately what percentage of your 1RM does your technique begin to break down in the squat/bench/deadlift?" — used to set initial RPE ceiling thresholds

#### 7.1.5 Step 5 — Training History & Programme Context

- "What has your most recent training programme been?" (free text or category selection)
- "Are you currently deloaded / have you had a deload in the last 2 weeks?" — affects initial block starting volume
- "How many consecutive weeks have you been training without a deload?" — used to inform the initial SFI baseline and whether to recommend an immediate deload before starting

#### 7.1.6 Step 6 — Schedule & Preferences

- Training days per week (3–6)
- Session duration preference (45 min / 60 min / 75 min / 90+ min) — affects maximum set counts per session
- Days available (day-of-week selection) — used to distribute session types
- Exercise preferences: any movements the user wants excluded (injury history, equipment availability)

#### 7.1.7 Onboarding Output

Upon onboarding completion, the engine performs an initial run of:
- MEV/MRV estimation for primary muscle groups
- Volume budget for first block
- Microcycle template generation
- Initial TTP estimate from training age
- Session schedule preview

The user reviews and confirms the generated first microcycle template before the first session is locked.

### 7.2 Programme Generator

The Programme Generator creates the microcycle template for each new Development Block. It is re-invoked at the start of each block (after the preceding deload/pivot).

#### 7.2.1 Exercise Selection Logic

**Primary lifts (competition exercises):**
Always included in the microcycle template. Frequency is determined by block phase and training frequency:

| Training Frequency | Primary Lift Frequency per Week |
|---|---|
| 3 days/week | Each lift 1×/week (SBD split) |
| 4 days/week | Squat 2×, Bench 2×, Deadlift 1× — or user-configured |
| 5 days/week | Squat 2×, Bench 3×, Deadlift 2× — or user-configured |

**Assistance exercises (close competition-lift variants):**
Selected from a curated database, filtered by:
1. Block phase (pause variations for accumulation; heavy singles for intensification)
2. Weak-point targeting (§6.7)
3. Equipment availability
4. User exclusion list

**Supplemental exercises (isolation/accessory):**
Selected to address identified structural weaknesses and maintain balanced development. Volume capped at MEV-level for supplemental work (these are maintenance volume for underdeveloped areas, not primary adaptation drivers in a strength block).

#### 7.2.2 Rep Range and RPE Target Selection by Phase

| Block Phase | Primary Lift Rep Range | Primary Lift RPE Target | Primary Assistance RPE | Volume Emphasis |
|---|---|---|---|---|
| Accumulation | 3–5 reps | RPE 7.5–8.5 | RPE 7–8 | Higher volume, moderate intensity |
| Intensification | 1–3 reps | RPE 8–9 | RPE 7.5–8.5 | Moderate volume, higher intensity |
| Realisation | 1–2 reps | RPE 8.5–9.5 | RPE 7–8 | Low volume, high specificity |
| Deload | 3–5 reps | RPE 6–7 | RPE 5.5–6.5 | ~50% of previous block volume |
| Pivot | 6–12 reps | RPE 7–8 | RPE 6–7.5 | Moderate volume, no max-effort singles |

#### 7.2.3 Session Duration Management

The system estimates session duration before generating the prescription:
```
estimated_duration = warmup_time [15 min default]
                   + Σ(sets × avg_set_duration × rest_period)
                   // avg_set_duration ≈ 45 sec; rest_period derived from RPE:
                   // RPE 8–9: 3–5 min; RPE 7–8: 2–3 min; RPE ≤7: 1.5–2 min

IF estimated_duration > user.session_duration_preference × 1.1:
  → Reduce back-off set ceiling for lowest-priority exercises first
  → Surface advisory: "Session estimated at X minutes — reduced supplemental work to fit"
```

### 7.3 Daily Session Flow

The session flow is the core product interaction loop. It must be optimised for use in the gym — minimal taps, large targets, one-handed operation.

#### 7.3.1 Pre-Session

1. **Wellness questionnaire** (5 items, sliding scale, < 60 seconds). Optionally prompted 30 minutes before scheduled session time via notification.
2. **RCS computation + session modifier preview**: "Your readiness today is 72/100. Standard session — no changes."
3. **Session overview card**: today's exercises, estimated duration, phase context ("Week 3 of Development Block — Accumulation Phase")

#### 7.3.2 Warm-Up Protocol

For each primary lift, the system generates a warm-up progression:

```
warmup_sets = [
  { load: 0,          reps: 10, note: "Bar only — focus on movement pattern" },
  { load: e1rm × 0.40, reps: 5  },
  { load: e1rm × 0.55, reps: 3  },
  { load: e1rm × 0.70, reps: 2  },
  { load: e1rm × 0.82, reps: 1  },
  // Benchmark set (if prescribed):
  { load: projected_rpe8_load, reps: top_set_reps, rpe_target: 8, is_benchmark: true }
]
```

Warm-up loads are calculated from the current session e1RM estimate. After the benchmark set, load calculation is updated if the actual RPE deviates from target (§4.5.2).

#### 7.3.3 Working Sets Interface

For each working set, the app presents:
- **Prescribed load** (calculated to hit target RPE) and prescribed reps
- **Timer**: rest-period countdown (tap to skip)
- **Set logger**: weight field (pre-filled with prescription), reps completed (pre-filled), RPE selector (0.5 increments, visual RIR reference)
- **Override button**: prominent one-tap to modify any parameter
- **Drop protocol indicator**: visual progress bar showing how many back-off sets have been completed and what the termination condition is

After each set:
- e1RM is updated and shown
- System confirms whether to continue back-off sets or terminate
- Next prescribed load for the following set is shown immediately

#### 7.3.4 In-Session Override Actions

Available at any point during a session without disrupting the flow:
- **Drop/add a set**: tap ± next to any exercise. Reason is logged (user can select from: "feeling strong," "joint pain," "time," "RPE too high," "other")
- **Swap exercise**: replace any non-primary lift with an alternative from a curated list. System notes the swap and uses it in weak-point response tracking
- **Adjust RPE target**: raise or lower the session-level RPE ceiling
- **Reactive deload**: end the session early and convert to a deload; system marks the block for deload evaluation
- **End session**: logs all completed sets; session review is triggered immediately

#### 7.3.5 Post-Session Review

Immediately following session completion (< 90 seconds):
1. **sRPE prompt**: "How hard was that session overall?" (CR-10 scale, 0–10)
2. **Session summary card**: total volume, sRPE load, SFI contribution, e1RM update per lift, comparison to previous session
3. **Notable flags** (if any): "Your squat e1RM is up 2.1% from last week — strong session."

### 7.4 Block Review & Analytics Dashboard

At the end of each Development Block (triggered by the deload decision), the system generates a Block Review. This is the primary data visualisation surface.

#### 7.4.1 Block Review Sections

**Performance Summary:**
- Primary lift e1RM progression chart (rolling e1RM across all block weeks, with peak marker)
- e1RM delta vs. previous block
- Confirmed TTP for this block vs. historical TTP

**Volume & Load Summary:**
- Weekly sets per muscle group vs. MEV/MAV/MRV landmarks (bar chart)
- Weekly sRPE Load trend (line chart)
- Weekly SFI accumulation (line chart; marked as proprietary heuristic)
- ACLR trend (line chart; week-by-week)

**Readiness & Recovery:**
- Weekly average RCS trend
- HRV deviation trend (if data available)
- Number of sessions where RCS triggered prescription modification

**Weak Point & Accessory Analysis:**
- Accessory exercise volume vs. primary lift e1RM delta correlation summary
- "Your paused squat volume correlated positively with your squat e1RM (r = 0.68 over 3 blocks) — it's been featured in the next block."

**Audit Log:**
- Every automatic engine decision in the block, with the rule that fired and its evidence basis
- User override count and frequency
- Prescription adherence rate

**Next Block Recommendation:**
- Proposed microcycle template for the next Development Block
- Rationale for any changes from the current block's template
- TTP estimate for the next block
- Option: "Review and customise" or "Start next block"

### 7.5 User Override & Collaborative Mode

Every prescription is a recommendation, not a mandate. The engine must be designed around user agency.

#### 7.5.1 Override Types

| Override | Action | System Response |
|---|---|---|
| RPE correction | User edits their post-set RPE | e1RM recalculates; user's RPE calibration model updates |
| Load modification | User trains at a different load than prescribed | Logged with reason; next-session projection recalculates |
| Set drop | User performs fewer back-off sets | Logged; SFI reflects actual volume; weekly volume tracking updated |
| Set add | User performs more sets than prescribed | Logged; SFI reflects actual volume; soft warning if approaching MRV |
| Exercise swap | User replaces an exercise | Swapped-to exercise added to the accessory responsiveness tracker |
| Intensity tier change | User selects "Low/Moderate/High" day (RPE 5–7 / 6–8 / 7–9) | Session prescription rescaled to intensity tier |
| Reactive deload | User manually triggers deload | Block terminates; deload block generated |
| Skip session | User marks a session as skipped | Session removed from block's rolling averages; TTP calculation pauses |

#### 7.5.2 Override Analytics

The system tracks the user's override patterns across sessions and blocks. High-frequency overrides of specific types are surfaced in the Block Review with suggested programme adjustments:

- "You've dropped back-off sets 6 of the last 8 sessions. Consider reducing the default drop target from 10% to 7%."
- "You've increased load above prescription 4 times this block. Consider raising the RPE target ceiling from 8.5 to 9."

### 7.6 Deload & Pivot Block Management

#### 7.6.1 Deload Entry Points

- Automatic trigger from deload trigger algorithm (§6.8)
- User-initiated "reactive deload" from in-session or home screen
- Scheduled (pre-competition; generated by peaking scheduler)

#### 7.6.2 Deload Structure Selection (User-Facing)

Upon deload trigger, the system presents the user with the recommended deload type and rationale:

```
"Your rolling squat e1RM has declined for 2 consecutive weeks and your
average readiness has been 58/100 this week. The system recommends a
1-week Active Deload to dissipate accumulated fatigue before your next
Development Block."

Option A: Active Deload (recommended)
  — Same exercises, 50% volume, maintained intensity (RPE 6–7)

Option B: Pivot Block
  — Different exercises, higher reps, 2 weeks
  — Recommended if you want to target hypertrophy or address a specific weak point

Option C: Complete Rest
  — No training; not recommended unless dealing with acute injury
  — Note: Research suggests complete cessation for >5 days may impair
    subsequent strength gains compared to active deloading.
```

#### 7.6.3 Pivot Block Generation

If Pivot Block is selected:
1. All competition lifts are replaced with variation movements (paused, tempo, unilateral)
2. Rep ranges shift to 6–12
3. Block duration = CLIP(ttp_previous_block × 0.33, 1, 3) weeks
4. Accessory work is biased toward the weakest identified accessory muscle groups
5. No back-off sets above RPE 8; no velocity-based or performance-drop termination — sets are fixed rep schemes to allow full mental relaxation from autoregulation

### 7.7 Competition Peaking Planner

#### 7.7.1 Competition Entry

User enters competition details:
- Competition date
- Weight class target (if cutting)
- Federation (governs equipment/lift standards)

#### 7.7.2 Peaking Plan Generation

Running the peaking scheduler algorithm (§6.9), the system generates a backwards-scheduled plan from the competition date:

```
Competition: [Date]
└── Final taper: 3 days pre-comp (active rest, no heavy loading)
└── Realisation phase: [Start Date] – [End Date]  (~2 weeks)
└── Pivot/Deload: [Start Date] – [End Date]  (~TTP × 0.33 weeks)
└── Development Block: [Start Date]  (TTP weeks)  ← Begin here
```

The system displays the full timeline with week-by-week phase markers. For each phase, it provides:
- Primary emphasis description
- Target RPE bands
- Approximate volume level relative to MRV
- What a "success indicator" looks like (e.g., "By the end of the development block, your e1RM should be 3–7% above your current rolling e1RM")

#### 7.7.3 Attempt Selection (Competition Day)

One week before the competition date, the system unlocks the Attempt Selection module:
- Displays current rolling e1RM per lift
- Recommends opener (approximately 92–94% of e1RM), second attempt (~98–100% e1RM), third attempt (competition PR target)
- Allows user to adjust; recalculates projected total from selected attempts
- Notes meet-specific rules (weight class, equipped status)

### 7.8 Notifications & Engagement

- **Pre-session reminder** (configurable, default 30 min before scheduled session): Includes wellness questionnaire prompt
- **Training day detection**: Session scheduled for today; tap to begin
- **Recovery advisory**: "Your readiness has been below 65 for 3 consecutive days. Consider prioritising sleep and nutrition before your next session."
- **Block milestone**: "You've completed 4 weeks of this Development Block. Your squat e1RM is up 4.2%." 
- **Deload recommendation** (push notification, urgent priority only when joint_pain_flag active or deload_score ≥ 8)
- All notifications are opt-in per category; default is on for training reminders, off for engagement/motivational content

---

## 8. Data Model

### 8.1 Core Entities

```
User
├── user_id (UUID)
├── biometrics { weight, height, dob, sex, training_age }
├── preferences { frequency, session_duration, goals, equipment }
├── rpe_calibration { sessions_logged, mean_absolute_error, last_updated }
├── lv_profile { slope, intercept, n_observations, exercise_id } // per lift
├── mev_estimates { muscle_group_id: sets_per_week }
├── mrv_estimates { muscle_group_id: sets_per_week }
├── ttp_history [ { block_id, ttp_weeks, block_type, primary_lift } ]
├── weak_point_profile { lift_id: { position, severity (1-5), last_updated } }
└── accessory_responsiveness { exercise_id: correlation_coefficient }

TrainingBlock
├── block_id (UUID)
├── user_id
├── type { DEVELOPMENT | DELOAD | PIVOT | PEAK }
├── phase { ACCUMULATION | INTENSIFICATION | REALISATION }
├── start_date, end_date
├── microcycle_template { ... }
├── target_ttp_weeks
├── actual_ttp_weeks (set at block close)
├── peak_e1rm { lift_id: e1rm_kg }
├── status { ACTIVE | COMPLETE | ABORTED }
└── audit_log [ { timestamp, rule_id, trigger_condition, action_taken } ]

Session
├── session_id (UUID)
├── block_id, user_id
├── scheduled_date, completed_date
├── wellness_inputs { sleep, fatigue, soreness, motivation, stress, hrv_rmssd? }
├── rcs_score (0–100)
├── sRPE_post (0–10)
├── sRPE_load (sRPE × duration)
├── sfi_total
├── volume_load_total
├── status { SCHEDULED | IN_PROGRESS | COMPLETE | SKIPPED }
└── overrides [ { type, reason, before_value, after_value } ]

SetLog
├── set_id (UUID)
├── session_id
├── exercise_id
├── set_number, set_type { TOP_SET | BENCHMARK | BACK_OFF | WARMUP }
├── prescribed_load, actual_load
├── prescribed_reps, actual_reps
├── prescribed_rpe_target, actual_rpe (user input)
├── velocity_mps (optional)
├── e1rm_session (calculated)
├── sfi_contribution (calculated)
└── flags { was_override, deviation_pct }

Exercise
├── exercise_id (UUID)
├── name, category, subcategory
├── primary_muscles [ muscle_group_id ]
├── default_efc (float)
├── movement_type { COMPETITION | ASSISTANCE | SUPPLEMENTAL | WARMUP }
├── applicable_lifts [ lift_id ]  // which primary lifts this supports
└── weak_point_targets [ { lift_id, position } ]  // which failure positions this addresses

e1RMHistory
├── record_id (UUID)
├── user_id, lift_id
├── session_id
├── e1rm_session_kg
├── e1rm_rolling_kg
├── calculation_methods_used [ METHOD ]
├── confidence_interval_pct
└── recorded_at

BlockReview
├── review_id (UUID)
├── block_id
├── generated_at
├── e1rm_delta_pct { lift_id: pct }
├── confirmed_ttp_weeks
├── peak_sfi_week
├── avg_rcs
├── accessory_correlations [ { exercise_id, correlation, n_observations } ]
├── override_count, override_types
└── next_block_recommendation { template_id, rationale, changes_from_current }
```

### 8.2 Key Reference Data

- **Exercise library:** Minimum 200 exercises at launch, tagged with EFC, movement type, muscle groups, applicable lifts, and weak-point targets
- **RPE-to-percentage table:** Stored per user; initialised from population-average (Tuchscherer/Helms chart); updated continuously from user performance
- **MEV/MRV defaults:** Stored per muscle group; initialised from training-age-specific defaults; updated from user data after 3+ blocks

---

## 9. Non-Functional Requirements

### 9.1 Performance

| Requirement | Target |
|---|---|
| Session prescription generation (after wellness input) | < 500ms |
| e1RM recalculation (after set log) | < 100ms |
| Block Review generation | < 3 seconds |
| App time-to-interactive (first load, 4G) | < 3 seconds |
| App time-to-interactive (cached, offline) | < 1 second |

### 9.2 Offline Capability

The PWA must be fully functional for session logging and prescription display without internet connectivity. The following features must operate offline:

- Session flow (complete): wellness input, warm-up, set logging, e1RM calculation
- RPE-to-load calculations
- SFI computation
- Partial Block Review (using locally cached data)

Data syncs automatically when connectivity is restored. Conflict resolution policy: local data is authoritative; server data does not overwrite local session data.

### 9.3 Data Integrity

- All set logs must be persisted to local storage before confirmation is shown to the user
- e1RM history must be append-only (no destructive edits); corrections are recorded as adjustment entries
- Block audit logs are immutable once written
- All calculations that feed the engine must be deterministic and replayable from the raw input data

### 9.4 Privacy

- All personally identifiable biometric data is stored locally by default; cloud sync is opt-in
- Health data (HRV, wellness questionnaire responses) is classified as sensitive health data
- No training data is shared with third parties without explicit user consent
- Data export must be available in machine-readable format (JSON) at any time

### 9.5 Accessibility

- Minimum WCAG 2.1 AA compliance
- All interactive gym-facing controls (set logging, RPE selector, timer) must be operable with large-touch targets (minimum 44pt × 44pt)
- Session flow must be functional one-handed
- High contrast mode required (gym lighting conditions)

### 9.6 Platform Requirements

- PWA installation: iOS 16.4+, Android 8+, Chrome/Edge/Safari desktop
- Service worker for offline functionality
- Web Push API for notifications (where platform supports)
- Optional native app shell (Capacitor) for deep Health Kit / Health Connect integration

---

## 10. Out of Scope / Future Phases

The following features are explicitly out of scope for Version 1.0:

**Phase 2:**
- Native iOS/Android app (Capacitor wrapper)
- Apple HealthKit / Google Health Connect native sync
- VBT hardware integrations (Bluetooth LE)
- Video-based technique analysis (form check AI)
- Coaching portal (allow a coach to review/override prescriptions for an athlete)

**Phase 3:**
- Multi-sport extensions (Olympic weightlifting, strongman)
- Nutrition tracking and integration with total recovery budget
- Sleep tracking integration (dedicated sleep stage analysis)
- Group/team programming (shared microcycle templates)

**Always out of scope:**
- Medical diagnosis or physiotherapy advice — the system provides training guidance only
- Novice lifter programming (< 6 months experience) — requires different methodology not covered here

---

## 11. Open Questions & Decisions

| # | Question | Owner | Target Resolution |
|---|---|---|---|
| OQ-01 | Should SFI coefficients be user-configurable from day one, or locked until 3+ blocks of data? | Product | Sprint 1 |
| OQ-02 | What is the minimum viable exercise library size at launch? Target: 200 exercises — is this achievable? | Engineering | Sprint 1 |
| OQ-03 | Should the RPE selector use 0.5 increments (11 values) or whole integers (6 values) for simplicity? Research supports 0.5 increments for experienced users but full integers may reduce cognitive load during sets. | Product | Sprint 2 |
| OQ-04 | Offline-first architecture: IndexedDB vs SQLite via OPFS — decision depends on target browser baseline | Engineering | Sprint 1 |
| OQ-05 | VBT integration timeline — will Phase 1 include a manual velocity entry field for users with hardware who want to self-input? | Product | Sprint 2 |
| OQ-06 | Should the Competition Peaking Planner be gated behind a "competitive lifter" user flag set during onboarding, or available to all users? | Product | Sprint 3 |
| OQ-07 | EFC table — should it be surfaced to users for manual editing from day one, or kept as a background parameter until block review? | Product | Sprint 2 |
| OQ-08 | What is the deload trigger recommendation UI? A disruptive modal interrupting the session, or a banner in the post-session review? Suggest: banner by default, modal only when joint_pain_flag is active. | Design | Sprint 3 |

---

## 12. Appendices

### Appendix A: Evidence Reference Table

| Component | Key Reference(s) | Evidence Tier |
|---|---|---|
| RIR-anchored RPE scale | Zourdos et al. 2016 (JSCR); Helms et al. 2017 (JSCR); Tuchscherer 2008 (RTS Manual) | VALIDATED |
| RPE-to-%1RM tables | Helms et al. 2018 (Frontiers); Tuchscherer chart | HEURISTIC (population average) |
| RPE accuracy at high intensity | Zourdos et al. 2016, 2021; Ormsbee et al. 2019 | VALIDATED |
| RPE accuracy degradation at low RPE | Armes et al. 2020; Hackett et al. 2012; Remmert et al. 2023 | VALIDATED (limitation) |
| Velocity-loss autoregulation | Pareja-Blanco et al. 2017, 2020; Sánchez-Medina & González-Badillo 2011 | VALIDATED |
| Autoregulation vs fixed prescription | Hickmott et al. 2022 (meta-analysis); Larsen et al. 2021 | VALIDATED |
| RPE vs %1RM for strength outcomes | Helms et al. 2018 | VALIDATED (small effect favoring RPE) |
| e1RM formula accuracy | LeSuer et al. 1997; DiStasio 2014; Reynolds et al. 2006 | VALIDATED |
| VBT load-velocity profiling | González-Badillo & Sánchez-Medina 2010; García-Ramos et al. 2018, 2019 | VALIDATED |
| VBT–RPE correlation | Helms et al. 2017; Larsen et al. 2024 | VALIDATED |
| Session-RPE (sRPE) load | Foster et al. 2001; Haddad et al. 2017 | VALIDATED |
| MEV/MRV concept (qualitative) | Schoenfeld et al. 2017; Pelland et al. 2024–25 | Conceptually VALIDATED |
| MEV/MRV specific numerics | Israetel et al. (Renaissance Periodization) | HEURISTIC |
| Hypertrophy dose-response | Schoenfeld et al. 2017, 2019; Pelland et al. 2024–25 | VALIDATED |
| Bondarchuk TTP framework | Bondarchuk 2007; Evely/Tuchscherer 2015 | HEURISTIC (observational) |
| Block vs DUP periodisation | Williams et al. 2017; Painter et al. 2012; Bartolomei et al. 2014, 2018 | VALIDATED (broadly equivalent) |
| Sticking point mechanics | Kompf & Arandjelović 2016, 2017 | VALIDATED |
| Deadlift biomechanical assessment | Beckham et al. 2018 | VALIDATED |
| Neural vs muscular limitations | Folland & Williams 2007; Aagaard et al. 2002 | VALIDATED (distinction exists; clean separation not possible without lab equipment) |
| Subjective wellness questionnaires | Saw, Main & Gastin 2016 (BJSM systematic review); McLean et al. 2010 | VALIDATED |
| HRV monitoring (trend level) | Plews et al. 2013; Buchheit 2014; Williams et al. 2017 | VALIDATED |
| HRV single-day reliability issues | Plews et al. 2013; Stanley et al. 2013 | VALIDATED (limitation) |
| ACLR validity | Gabbett 2016; Impellizzeri et al. 2020; Lolli et al. 2019 | CONTESTED |
| Deload — no adaptation enhancement | Coleman et al. 2024 (PeerJ) | VALIDATED (single RCT; needs replication) |
| Active vs complete-cessation deload | Coleman et al. 2024; Bosquet et al. 2007 | VALIDATED |
| Deload in coaching practice | Bell et al. 2022 | VALIDATED (qualitative) |
| Detraining timeline | Ogasawara et al. 2013; Bosquet et al. 2007 | VALIDATED |
| Session Fatigue Index formula | Not externally validated | PROPRIETARY HEURISTIC |
| Exercise Fatigue Coefficients (EFC) | Morán-Navarro et al. 2017 (differential recovery times, not coefficients) | PROPRIETARY HEURISTIC |
| Pivot block benefits | No direct RCT evidence | HEURISTIC (coaching practice) |

### Appendix B: Default MEV/MRV Initialisation Table

*These values are initialised from the Israetel et al. framework and adjusted by training age. All values in sets/week. All are HEURISTIC starting estimates, personalised after 3 completed blocks.*

| Muscle Group | Novice MEV | Intermediate MEV | Advanced MEV | Intermediate MRV | Advanced MRV |
|---|---|---|---|---|---|
| Quadriceps | 6 | 8 | 10 | 18 | 22 |
| Hamstrings | 4 | 6 | 8 | 16 | 20 |
| Glutes | 4 | 6 | 8 | 16 | 20 |
| Spinal Erectors | 4 | 6 | 8 | 14 | 18 |
| Pectorals | 6 | 8 | 10 | 18 | 22 |
| Anterior Deltoid | 4 | 6 | 8 | 14 | 18 |
| Triceps | 4 | 6 | 8 | 16 | 20 |
| Lats (upper back) | 6 | 8 | 10 | 18 | 22 |
| Biceps | 4 | 5 | 6 | 14 | 18 |
| Rear Deltoid / Rotator Cuff | 4 | 6 | 8 | 14 | 18 |
| Core (anterior) | 4 | 6 | 8 | 16 | 20 |

### Appendix C: Proprietary Component Declarations

The following components in this PRD are proprietary heuristics that are not externally validated. They must be presented to users with appropriate framing and never claimed as peer-reviewed scientific measurements:

1. **Session Fatigue Index (SFI):** A proprietary intra-system metric used for relative trend tracking and deload signalling. Users are told: *"The Session Fatigue Index is Forge's internal fatigue estimate. It is a useful relative indicator of training stress trends within your own history, but should not be compared to any external benchmark or presented as a scientific measurement."*

2. **Exercise Fatigue Coefficients (EFC):** Expert-consensus-derived multipliers, informed by differential recovery research, that are continuously personalised to the user. Users are told: *"EFC values are Forge's estimates of how systemically taxing each exercise is for you personally. They start from general estimates and are refined by your recovery data over time."*

3. **Bottom-Up Periodisation / Time-to-Peak (TTP):** A periodisation approach derived from Bondarchuk's coaching framework and not directly validated by RCTs in powerlifting. Users are told: *"Forge observes when your strength peaks and uses that to time your programme. This approach is inspired by elite coaching practice but your Time-to-Peak is treated as a learned estimate, not a known biological constant."*

---

*End of Document*

*Version 1.0 — Internal use only*  
*All training content is informational. This is not medical advice. Consult a qualified professional before commencing any strength training programme.*
