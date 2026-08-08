import { store } from "../main.js";
import { embed } from "../util.js";
import { score } from "../score.js";
import { fetchEditors, fetchList } from "../content.js";

import Spinner from "../components/Spinner.js";
import LevelAuthors from "../components/List/LevelAuthors.js";

const roleIconMap = {
    owner: "crown",
    admin: "user-gear",
    helper: "user-shield",
    dev: "code",
    trial: "user-lock",
};

const tierOrder = [
    "Extreme Demon",
    "Insane Demon",
    "Hard Demon",
    "Medium Demon",
    "Easy Demon",
];

export default {
    components: { Spinner, LevelAuthors },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container">
                <div class="list-controls">
                    <input
                        type="search"
                        class="list-search"
                        v-model="search"
                        placeholder="Search levels..."
                        aria-label="Search levels"
                    >
                    <div class="list-filters">
                        <select v-model="filterTier" aria-label="Filter by difficulty">
                            <option value="">All Difficulties</option>
                            <option v-for="tier in tierOptions" :key="tier" :value="tier">{{ tier }}</option>
                        </select>
                        <select v-model="filterEra" aria-label="Filter by era">
                            <option value="">All Eras</option>
                            <option v-for="era in eraOptions" :key="era" :value="era">{{ era }}</option>
                        </select>
                    </div>
                </div>
                <div class="list-scroll">
                    <table class="list" v-if="list">
                        <template v-for="row in rows" :key="row.key">
                            <tr v-if="row.type === 'header'" class="list-section">
                                <td colspan="2" class="type-label-lg">{{ row.label }}</td>
                            </tr>
                            <tr v-else>
                                <td class="rank">
                                    <p v-if="row.i + 1 <= 150" class="type-label-lg">#{{ row.i + 1 }}</p>
                                    <p v-else class="type-label-lg">Legacy</p>
                                </td>
                                <td class="level" :class="{ 'active': selected == row.i, 'error': !row.level }">
                                    <button @click="selectLevel(row.i)">
                                        <span
                                            v-if="row.level?.difficultyTier"
                                            class="tier-dot"
                                            :class="'tier-' + tierClass(row.level.difficultyTier)"
                                            :title="row.level.difficultyTier"
                                        ></span>
                                        <span class="type-label-lg">{{ row.level?.name || \`Error (\${row.err}.json)\` }}</span>
                                    </button>
                                </td>
                            </tr>
                        </template>
                        <tr v-if="rows.length === 0">
                            <td colspan="2" class="list-empty type-label-lg">No levels match your search.</td>
                        </tr>
                    </table>
                </div>
            </div>
            <div class="level-container">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <div class="level-badges" v-if="level.difficultyTier || level.version || level.coins">
                        <span v-if="level.difficultyTier" class="chip" :class="'chip-' + tierClass(level.difficultyTier)">{{ level.difficultyTier }}</span>
                        <span v-if="level.version" class="chip chip-era">v{{ level.version }}</span>
                        <span v-if="level.coins" class="chip chip-coins">🪙 {{ level.coins }}</span>
                    </div>
                    <LevelAuthors :author="level.author" :creators="level.creators" :verifier="level.verifier"></LevelAuthors>
                    <div class="video-container">
                        <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                        <button v-if="level.showcase" class="btn showcase-toggle" @click="toggledShowcase = !toggledShowcase">
                            <span class="type-label-lg">{{ toggledShowcase ? 'Show Verification' : 'Show Showcase' }}</span>
                        </button>
                    </div>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Points when completed</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.id }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <div class="level-song" v-if="level.song || level.songAuthor">
                        <div class="type-title-sm">Song</div>
                        <p class="type-body">{{ level.song || 'Unknown' }}<span v-if="level.songAuthor"> — {{ level.songAuthor }}</span></p>
                    </div>
                    <h2>Records</h2>
                    <p v-if="selected + 1 <= 75"><strong>{{ level.percentToQualify }}%</strong> or better to qualify</p>
                    <p v-else-if="selected +1 <= 150"><strong>100%</strong> or better to qualify</p>
                    <p v-else>This level does not accept new records.</p>
                    <div class="records-scroll">
                        <table class="records">
                            <tr v-for="record in level.records" class="record">
                                <td class="percent">
                                    <p>{{ record.percent }}%</p>
                                </td>
                                <td class="user">
                                    <a :href="record.link" target="_blank" class="type-label-lg">{{ record.user }}</a>
                                </td>
                                <td class="mobile">
                                    <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                                </td>
                                <td class="hz">
                                    <p>{{ record.hz }}Hz</p>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <div class="og">
                        <p class="type-label-md">Website layout made by <a href="https://tsl.pages.dev/" target="_blank">TheShittyList</a></p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${store.dark ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
<h3>Submission Requirements</h3>
<p>
    <strong>1. Legitimacy & Mods:</strong> Records must be achieved without hacks or gameplay-altering mods (e.g., speedhack, noclip, hitbox display). Quality-of-life mods (like Geode, Megahack UI, or basic FPS bypass up to 360 FPS) are fully allowed.
</p>
<p>
    <strong>2. Correct Level:</strong> You must complete the exact level ID linked on the site. Modified, copied, or bugged versions will be rejected.
</p>
<p>
    <strong>3. Raw Audio Requirement:</strong> The video must include clear game audio or audible physical clicks/taps. Submissions with edited-over music, muted audio, or missing clicks will be denied.
</p>
<p>
    <strong>4. Full Completion Footage:</strong> The recording must cleanly show the entire attempt from 0% to the endwall / end screen without any cuts, splices, or overlays hiding gameplay.
</p>
<p>
    <strong>5. No Exploits:</strong> Skip routes, secret ways, or unintended bugged paths that bypass significant portions of the level are prohibited.
</p>
<p>
    <strong>6. Video Quality & Availability:</strong> Videos must be uploaded to a public host (YouTube, Twitch VOD, Streamable) at a readable resolution (minimum 720p recommended) so gameplay details are visible.
</p>
<p>
    <strong>7. Legacy Submissions:</strong> Once a level falls off the main list into the Legacy section, new submissions are accepted for <strong>7 days</strong> after the move. After that window closes, no new legacy records will be accepted.
</p>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        list: [],
        editors: [],
        loading: true,
        selected: 0,
        errors: [],
        roleIconMap,
        store,
        search: "",
        filterTier: "",
        filterEra: "",
        toggledShowcase: false,
    }),
    computed: {
        level() {
            return this.list[this.selected]?.[0];
        },
        video() {
            if (!this.level.showcase) {
                return embed(this.level.verification);
            }

            return embed(
                this.toggledShowcase
                    ? this.level.showcase
                    : this.level.verification
            );
        },
        tierOptions() {
            const present = new Set(
                this.list
                    .filter(([level]) => level?.difficultyTier)
                    .map(([level]) => level.difficultyTier)
            );
            return tierOrder.filter((tier) => present.has(tier));
        },
        eraOptions() {
            const present = new Set(
                this.list.filter(([level]) => level?.version).map(([level]) => level.version)
            );
            return [...present].sort((a, b) => parseFloat(a) - parseFloat(b));
        },
        filteredIndices() {
            const query = this.search.trim().toLowerCase();
            return this.list
                .map((entry, i) => ({ entry, i }))
                .filter(({ entry: [level] }) => {
                    // Always surface levels that failed to load so errors stay visible.
                    if (!level) return true;
                    if (query && !level.name.toLowerCase().includes(query)) {
                        return false;
                    }
                    if (this.filterTier && level.difficultyTier !== this.filterTier) {
                        return false;
                    }
                    if (this.filterEra && level.version !== this.filterEra) {
                        return false;
                    }
                    return true;
                });
        },
        rows() {
            const rows = [];
            let lastSection = null;
            for (const { entry, i } of this.filteredIndices) {
                const rank = i + 1;
                const section =
                    rank <= 75 ? "Main List" : rank <= 150 ? "Extended List" : "Legacy";
                if (section !== lastSection) {
                    rows.push({ type: "header", key: `header-${section}`, label: section });
                    lastSection = section;
                }
                rows.push({
                    type: "level",
                    key: `level-${i}`,
                    i,
                    level: entry[0],
                    err: entry[1],
                });
            }
            return rows;
        },
    },
    async mounted() {
        // Hide loading spinner
        this.list = await fetchList();
        this.editors = await fetchEditors();

        // Error handling
        if (!this.list) {
            this.errors = [
                "Failed to load list. Retry in a few minutes or notify list staff.",
            ];
        } else {
            this.errors.push(
                ...this.list
                    .filter(([_, err]) => err)
                    .map(([_, err]) => {
                        return `Failed to load level. (${err}.json)`;
                    })
            );
            if (!this.editors) {
                this.errors.push("Failed to load list editors.");
            }
            this.selectFromSlug(this.$route.params.slug);
        }

        this.loading = false;
    },
    watch: {
        "$route.params.slug"(slug) {
            this.selectFromSlug(slug);
        },
    },
    methods: {
        embed,
        score,
        tierClass(tier) {
            if (!tier) return "";
            return tier.split(" ")[0].toLowerCase();
        },
        selectLevel(i) {
            this.selected = i;
            this.toggledShowcase = false;
            const level = this.list[i]?.[0];
            if (level) {
                this.$router.replace(`/level/${level.path}`).catch(() => {});
            }
        },
        selectFromSlug(slug) {
            if (!slug || this.list.length === 0) return;
            const idx = this.list.findIndex(([level]) => level && level.path === slug);
            if (idx !== -1) {
                this.selected = idx;
                this.toggledShowcase = false;
            }
        },
    },
};
