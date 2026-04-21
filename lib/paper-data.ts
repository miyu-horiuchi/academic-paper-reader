export const READER_TOKENS = {
  paper: "#faf7f2",
  paperDeep: "#f2ede3",
  ink: "#2a241f",
  ink2: "#5a4f46",
  ink3: "#8a7e72",
  rule: "rgba(60, 45, 30, 0.08)",
  ruleStrong: "rgba(60, 45, 30, 0.15)",
  accent: "#b8873d",
  accentSoft: "rgba(184,135,61,0.14)",
  hl: {
    yellow: "rgba(247, 220, 111, 0.55)",
    blue: "rgba(139, 196, 222, 0.45)",
    pink: "rgba(232, 158, 170, 0.4)",
    green: "rgba(172, 204, 141, 0.45)",
  },
  serif: '"New York","Charter","Iowan Old Style","Cambria",Georgia,serif',
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", system-ui, sans-serif',
} as const;

export const LEVELS = ["beginner", "intermediate", "expert"] as const;
export type Level = (typeof LEVELS)[number];

export type HighlightColor = keyof typeof READER_TOKENS.hl;

export type Sentence = {
  text: string;
  rephrase: Record<Level, string>;
};

export type Section = {
  id: string;
  title: string;
  explain: Record<Level, string>;
  body: Sentence[];
};

export type Paper = {
  id: string;
  title: string;
  authors: string;
  venue: string;
  pinned: boolean;
  folder: string;
  updated: string;
  sections: Section[];
};

export const PAPER: Paper = {
  id: "attention",
  title: "Attention Is All You Need",
  authors:
    "Vaswani, Shazeer, Parmar, Uszkoreit, Jones, Gomez, Kaiser, Polosukhin",
  venue: "NeurIPS 2017",
  pinned: true,
  folder: "ML Foundations",
  updated: "Apr 18, 2026",
  sections: [
    {
      id: "abstract",
      title: "Abstract",
      explain: {
        beginner:
          'Before this paper, AI that read language used slow, step-by-step networks. The authors introduce the Transformer — a new design that reads all the words at once using just "attention," a mechanism that lets the model decide which words matter for each other word. It trained faster and translated better.',
        intermediate:
          "Proposes the Transformer, a seq2seq architecture based solely on multi-head self-attention — no recurrence, no convolutions. Achieves SOTA on WMT 2014 EN→DE (28.4 BLEU) and EN→FR (41.8 BLEU) at a fraction of the training cost of prior models.",
        expert:
          "Eliminates recurrence entirely in favor of scaled dot-product attention with O(n²·d) sequence operations, fully parallelizable along the sequence axis. Encoder–decoder stack of 6 layers, 8 heads, d_model=512. New SOTA on WMT14 EN-DE/FR with 3.5 days of 8× P100 training for the base model.",
      },
      body: [
        {
          text: "The dominant [[sequence transduction]] models are based on complex [[recurrent]] or [[convolutional]] neural networks that include an encoder and a decoder.",
          rephrase: {
            beginner:
              "Most AI that turns one sequence of words into another (like translation) uses complicated networks that read one word at a time.",
            intermediate:
              "State-of-the-art seq2seq systems use RNN or CNN-based encoder–decoder stacks.",
            expert:
              "Prior SOTA in sequence transduction relies on gated RNNs (LSTM/GRU) or CNN encoder–decoder architectures.",
          },
        },
        {
          text: "The best performing models also connect the encoder and decoder through an [[attention]] mechanism.",
          rephrase: {
            beginner:
              'The best of these also have a way to "pay attention" to relevant words when translating.',
            intermediate:
              "The top systems augment recurrent backbones with encoder–decoder attention.",
            expert:
              "Bahdanau-style soft attention between encoder states and decoder hidden states is the top-performing configuration.",
          },
        },
        {
          text: "We propose a new simple network architecture, the [[Transformer]], based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
          rephrase: {
            beginner:
              "We propose a simpler design, called the Transformer, that uses only attention — no step-by-step reading needed.",
            intermediate:
              "We introduce the Transformer: an attention-only architecture with no recurrent or convolutional layers.",
            expert:
              "We present the Transformer — a fully attentional encoder–decoder with no recurrence or convolutions, trained end-to-end.",
          },
        },
        {
          text: "Experiments on two machine translation tasks show these models to be superior in quality while being more parallelizable and requiring significantly less time to train.",
          rephrase: {
            beginner: "On two translation tests, it was more accurate and much faster to train.",
            intermediate:
              "Two MT benchmarks: better quality, more parallelism, and less wall-clock training time.",
            expert:
              "WMT14 EN→DE and EN→FR: improved BLEU, higher GPU utilization via sequence-axis parallelism, and reduced training FLOPs vs. prior SOTA.",
          },
        },
      ],
    },
    {
      id: "intro",
      title: "1 · Introduction",
      explain: {
        beginner:
          "Older language models (RNNs, LSTMs) had to read one word at a time, which was slow. This section explains why that slowness is a problem and motivates a fully parallel design.",
        intermediate:
          "Motivates the shift away from RNN-based seq2seq: recurrence prevents parallelization within training examples, which limits batch efficiency for long sequences. Attention-only models let you parallelize fully across the sequence.",
        expert:
          "Frames the architectural bottleneck: h_t = f(h_{t−1}, x_t) forces O(n) sequential ops along the sequence dimension, precluding intra-example parallelism and straining memory at long context. Attention decouples position-to-position dependencies from sequential compute.",
      },
      body: [
        {
          text: "[[Recurrent]] neural networks, [[long short-term memory]] and [[gated recurrent]] neural networks in particular, have been firmly established as state-of-the-art approaches in sequence modeling.",
          rephrase: {
            beginner:
              "RNNs and LSTMs have been the standard tool for language tasks for years.",
            intermediate:
              "RNNs, LSTMs, and GRUs are the prevailing sequence-modeling architectures.",
            expert:
              "Gated recurrent networks (LSTM, GRU) constitute the prevailing paradigm in sequence modeling and transduction tasks.",
          },
        },
        {
          text: "Recurrent models typically factor computation along the symbol positions of the input and output sequences.",
          rephrase: {
            beginner: "They process one position at a time, in order.",
            intermediate: "Compute is structured sequentially over positions.",
            expert:
              "Recurrence induces a temporal factorization h_t = f(h_{t−1}, x_t), tying compute to position index.",
          },
        },
        {
          text: "This inherently sequential nature precludes [[parallelization]] within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.",
          rephrase: {
            beginner:
              "Because each step depends on the last, you can't do them at the same time — this is slow, especially for long text.",
            intermediate:
              "Sequential dependence blocks intra-example parallelism; long sequences worsen the issue as memory caps the batch.",
            expert:
              "The O(n) sequential dependency chain along the sequence axis eliminates intra-example parallelism; memory scaling with n reduces feasible batch size at long context lengths.",
          },
        },
      ],
    },
    {
      id: "attention",
      title: "3.2 · Attention",
      explain: {
        beginner:
          'Attention is how the model decides which other words to look at when processing a word. Think of reading "the animal didn\'t cross the street because it was tired" — "it" should pay attention to "animal." That\'s attention.',
        intermediate:
          "Attention maps a query and a set of key–value pairs to an output, computed as a weighted sum of the values, where the weight of each value is computed by a compatibility function between the query and the corresponding key.",
        expert:
          "Scaled dot-product attention: Attention(Q,K,V) = softmax(QK^T/√d_k)V. Scaling by √d_k keeps the softmax in a well-gradient regime for large d_k. Multi-head attention projects Q,K,V into h subspaces and concatenates — enables attending to information from different representation subspaces at different positions.",
      },
      body: [
        {
          text: "An [[attention]] function can be described as mapping a [[query]] and a set of [[key]]-[[value]] pairs to an output.",
          rephrase: {
            beginner:
              "Attention is a lookup: you ask a question (query), compare it to labels (keys), and get back information (values).",
            intermediate: "Attention maps (Q, {K,V}) to a weighted combination of V.",
            expert:
              "Attention is a content-addressable read: given query q and memory {(k_i, v_i)}, it returns Σ α_i v_i where α = softmax(f(q, k_i)).",
          },
        },
        {
          text: "The output is computed as a weighted sum of the values, where the weight assigned to each value is computed by a compatibility function of the query with the corresponding key.",
          rephrase: {
            beginner:
              "The answer is a blend of the values, weighted by how well each key matches your question.",
            intermediate: "Output = Σ α_i · v_i, with α_i = softmax(score(q, k_i)).",
            expert:
              "Formally, Attention(q, K, V) = Σ softmax(score(q, k_i))·v_i; score is typically scaled dot-product or additive MLP.",
          },
        },
        {
          text: 'We call our particular attention "[[Scaled Dot-Product Attention]]".',
          rephrase: {
            beginner: "Our version is called Scaled Dot-Product Attention.",
            intermediate: "We use scaled dot-product attention as the compatibility function.",
            expert:
              "We adopt scaled dot-product attention: score(q,k) = q·k / √d_k, chosen for compute efficiency over additive attention.",
          },
        },
      ],
    },
  ],
};

export const TERMS: Record<string, { short: string; full: string }> = {
  "sequence transduction": {
    short: "Turning one sequence into another (e.g. English → French, or speech → text).",
    full: "A class of tasks where a model reads an input sequence and produces an output sequence, possibly of different length. Machine translation, summarization, and speech recognition are all sequence transduction problems.",
  },
  recurrent: {
    short: "A network that processes a sequence one step at a time, passing state forward.",
    full: "Recurrent neural networks (RNNs) maintain a hidden state h_t = f(h_{t−1}, x_t), reading tokens in order. Classic but slow: each step waits for the previous one.",
  },
  convolutional: {
    short: "A network that slides small filters over the input to extract local patterns.",
    full: "CNNs apply the same filter across positions, capturing local structure efficiently. Used in vision and in some sequence models (ByteNet, ConvS2S) as an alternative to recurrence.",
  },
  attention: {
    short: "Mechanism that lets the model weight how much each input position matters for each output position.",
    full: 'Given a query, keys and values, attention returns a weighted sum of values where weights come from query-key similarity. It lets any output position directly "see" any input position in one step — no sequential bottleneck.',
  },
  Transformer: {
    short: "The architecture introduced by this paper — attention-only, no recurrence.",
    full: "A seq2seq architecture built entirely from multi-head self-attention + feed-forward layers + layer-norm + residuals. Became the foundation for BERT, GPT, T5, and nearly every modern LLM.",
  },
  "long short-term memory": {
    short: "An RNN variant designed to remember information over long spans.",
    full: "LSTM networks use gating mechanisms (input, forget, output) to control how information flows through time, mitigating the vanishing-gradient problem of vanilla RNNs.",
  },
  "gated recurrent": {
    short: "A simpler LSTM variant with two gates instead of three.",
    full: 'GRU (gated recurrent unit) merges the forget and input gates into a single "update" gate, with fewer parameters than LSTM but comparable performance on many tasks.',
  },
  parallelization: {
    short: "Running many computations at the same time instead of one after another.",
    full: "On GPUs, parallelism is what makes training fast. RNNs force you to wait for step t−1 before computing step t; attention-only models let you compute all positions simultaneously.",
  },
  query: {
    short: 'The "question" vector — what information the current position is looking for.',
    full: "In attention, each position produces a query q. The attention output is a weighted blend of values based on how well q matches each key.",
  },
  key: {
    short: 'The "label" vector — what each source position offers as a match target.',
    full: "Each source position produces a key k. Query-key similarity (typically dot product) determines how much that position's value contributes to the output.",
  },
  value: {
    short: "The actual information carried by a position, blended into the output.",
    full: "Each source position produces a value v. The attention output is Σ softmax(q·k)·v — a weighted sum of values.",
  },
  "Scaled Dot-Product Attention": {
    short: "Attention(Q,K,V) = softmax(QK^T / √d_k) · V",
    full: "Compute dot products of the query with all keys, divide by √d_k to keep gradients stable, softmax to get weights, and use them to blend the values. Fast because it's just two matrix multiplies.",
  },
};

export type LibraryPaper = {
  id: string;
  title: string;
  authors: string;
  year: number;
  folder: string;
  pinned: boolean;
  reading?: boolean;
  updated: string;
  tags: string[];
  unread?: number;
};

export type FolderKey =
  | "all"
  | "recent"
  | "pinned"
  | "reading"
  | "ml"
  | "multi"
  | "gen"
  | "bio"
  | "rl"
  | "vision";

export const FOLDER_MATCH: Record<FolderKey, (p: LibraryPaper) => boolean> = {
  all: () => true,
  recent: (p) => /day|week/.test(p.updated ?? ""),
  pinned: (p) => p.pinned,
  reading: (p) => Boolean(p.reading),
  ml: (p) => p.folder === "ML Foundations",
  multi: (p) => p.folder === "Multimodal",
  gen: (p) => p.folder === "Generative",
  bio: (p) => p.folder === "Biology",
  rl: (p) => p.folder === "RL",
  vision: (p) => p.folder === "Vision",
};

export const FOLDER_DROP: Record<FolderKey, (p: LibraryPaper) => LibraryPaper> = {
  all: (p) => p,
  recent: (p) => ({ ...p, updated: "just now" }),
  pinned: (p) => ({ ...p, pinned: true }),
  reading: (p) => ({ ...p, reading: true }),
  ml: (p) => ({ ...p, folder: "ML Foundations" }),
  multi: (p) => ({ ...p, folder: "Multimodal" }),
  gen: (p) => ({ ...p, folder: "Generative" }),
  bio: (p) => ({ ...p, folder: "Biology" }),
  rl: (p) => ({ ...p, folder: "RL" }),
  vision: (p) => ({ ...p, folder: "Vision" }),
};

export const LIBRARY: LibraryPaper[] = [
  { id: "attention", title: "Attention Is All You Need", authors: "Vaswani et al.", year: 2017, folder: "ML Foundations", pinned: true, updated: "2 days ago", tags: ["transformer", "seq2seq"], unread: 2 },
  { id: "bert", title: "BERT: Pre-training of Deep Bidirectional Transformers", authors: "Devlin et al.", year: 2018, folder: "ML Foundations", pinned: true, updated: "5 days ago", tags: ["nlp", "pretraining"] },
  { id: "gpt3", title: "Language Models are Few-Shot Learners", authors: "Brown et al.", year: 2020, folder: "ML Foundations", pinned: false, updated: "1 week ago", tags: ["gpt", "in-context"] },
  { id: "clip", title: "Learning Transferable Visual Models From Natural Language Supervision", authors: "Radford et al.", year: 2021, folder: "Multimodal", pinned: false, updated: "2 weeks ago", tags: ["clip", "vision"] },
  { id: "diffusion", title: "Denoising Diffusion Probabilistic Models", authors: "Ho et al.", year: 2020, folder: "Generative", pinned: true, updated: "3 weeks ago", tags: ["diffusion", "generative"] },
  { id: "alphafold", title: "Highly accurate protein structure prediction with AlphaFold", authors: "Jumper et al.", year: 2021, folder: "Biology", pinned: false, updated: "1 month ago", tags: ["protein", "biology"] },
  { id: "dqn", title: "Human-level control through deep reinforcement learning", authors: "Mnih et al.", year: 2015, folder: "RL", pinned: false, updated: "2 months ago", tags: ["rl", "atari"] },
  { id: "adam", title: "Adam: A Method for Stochastic Optimization", authors: "Kingma & Ba", year: 2014, folder: "ML Foundations", pinned: false, updated: "3 months ago", tags: ["optimization"] },
  { id: "resnet", title: "Deep Residual Learning for Image Recognition", authors: "He et al.", year: 2015, folder: "Vision", pinned: false, updated: "4 months ago", tags: ["resnet", "vision"] },
];

export type FolderEntry =
  | { type: "divider" }
  | { id: FolderKey; name: string; icon: "library" | "clock" | "pin" | "bookmark" | "folder"; type?: never };

export const FOLDERS: FolderEntry[] = [
  { id: "all", name: "All Papers", icon: "library" },
  { id: "recent", name: "Recent", icon: "clock" },
  { id: "pinned", name: "Pinned", icon: "pin" },
  { id: "reading", name: "Currently Reading", icon: "bookmark" },
  { type: "divider" },
  { id: "ml", name: "ML Foundations", icon: "folder" },
  { id: "multi", name: "Multimodal", icon: "folder" },
  { id: "gen", name: "Generative", icon: "folder" },
  { id: "bio", name: "Biology", icon: "folder" },
  { id: "rl", name: "RL", icon: "folder" },
  { id: "vision", name: "Vision", icon: "folder" },
];
