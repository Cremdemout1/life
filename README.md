# Life

An experimental artificial-life simulation exploring how simple neural networks can produce emergent behavior in autonomous agents.

> **Status:** Work in progress / experimental

## Overview

**Life** is an unfinished experiment in artificial life and machine learning.

The goal was to create a small simulated environment in which autonomous agents could interact with their surroundings, learn from experience, and gradually develop useful behaviors without having those behaviors explicitly programmed.

The project explores a simple question:

**How much complex behavior can emerge from relatively simple learning systems and environmental feedback?**

The simulation combines a grid-based environment with autonomous agents, neural networks, and pheromone-based communication.

## What the experiment achieved

The project is **not a finished artificial-life simulation**, but the experiments produced two interesting behaviors:

### 🧭 Learning where not to go

The agents were able to learn spatial information about the environment and progressively avoid areas that led to undesirable outcomes.

Rather than explicitly encoding every path or rule, the learning system allowed the agents to develop a basic representation of **places to avoid**.

### 🐜 Pheromone-based behavior

Agents could also interact with pheromone information in the environment.

Through experimentation, the system was able to produce useful pheromone placement, allowing agents to leave information in their environment and influence subsequent behavior.

This was one of the more interesting results of the project: instead of agents communicating directly, information could be stored **in the environment itself**.

## Architecture

The project is written primarily in **TypeScript**.

The main components include:

* `cell.ts` — individual elements of the simulated environment
* `map.ts` — representation and management of the environment
* `policyNetwork.ts` — neural network responsible for agent decision-making
* `unsupervisedNetwork.ts` — experimental unsupervised learning component
* `random_gen.ts` — random generation utilities

The repository also contains a lightweight web interface and Docker configuration for running the simulation.

## Concept

The project is inspired by ideas from:

* Artificial life
* Reinforcement learning
* Unsupervised learning
* Emergent behavior
* Collective intelligence
* Ant colony behavior
* Environmental memory

A central idea behind the experiment is that **the environment itself can act as a form of memory**.

Instead of giving every agent a complete representation of the world, agents can interact with traces left behind by previous agents. Pheromones therefore become a primitive communication mechanism between individuals that don't directly communicate.

## Current limitations

This project is intentionally documented as an **unfinished experiment**.

Several parts of the original idea remain incomplete, and the learning system does not yet produce the sophisticated autonomous behavior originally envisioned.

The current implementation should therefore be viewed as a prototype and experimentation platform rather than a finished artificial-life system.

In particular, the successful behaviors are currently limited to:

* Learning regions that should be avoided
* Producing useful pheromone placement
* Basic interaction between learned behavior and the environment

More advanced forms of learning and emergent behavior remain to be implemented.

## Future directions

Potential directions for continuing the experiment include:

* More sophisticated reward mechanisms
* Persistent environmental memory
* Improved policy learning
* Competition and cooperation between agents
* Resource gathering
* Reproduction and evolution
* Agent specialization
* More complex pheromone dynamics
* Long-term behavioral adaptation
* Measuring whether increasingly complex behaviors emerge from simple rules

The ultimate goal would be to see whether a population of relatively simple agents can develop increasingly complex strategies through **learning, environmental feedback, and interaction with one another**.

## Running the project

Clone the repository:

```bash
git clone https://github.com/Cremdemout1/life.git
cd life
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The project can also be run using the included Docker configuration.

## Why this project?

This project was an exploration of the intersection between **artificial intelligence and cognitive science**.

Rather than starting with a predefined intelligent behavior, the experiment asked what happens when agents are given relatively simple learning mechanisms and allowed to discover useful information about their environment.

The project is incomplete, but the behaviors that did emerge — particularly learning **where not to go** and using **pheromones as environmental information** — made the experiment worthwhile.

---

**Status:** Experimental / unfinished
**Language:** TypeScript
**Focus:** Artificial Life · Neural Networks · Emergent Behavior · Unsupervised Learning
