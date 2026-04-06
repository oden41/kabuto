# Kabuto 兜

日本株市場に特化した自律型AI金融リサーチエージェント。複雑な投資リサーチを、計画・実行・検証のサイクルで自動的に遂行します。

> **Note**: 本プロジェクトは [virattt/dexter](https://github.com/virattt/dexter) からフォークし、日本株市場向けに再構築したものです。Dexterの優れたエージェントアーキテクチャをベースに、データソース・プロンプト・投資哲学を日本市場に最適化しています。

「兜（Kabuto）」の名前は、日本の金融の中心地である東京・兜町に由来しています。

## 目次

- [概要](#概要)
- [Dexterからの変更点](#dexterからの変更点)
- [前提条件](#前提条件)
- [インストール](#インストール)
- [使い方](#使い方)
- [評価](#評価)
- [デバッグ](#デバッグ)
- [WhatsApp連携](#whatsapp連携)
- [コントリビュート](#コントリビュート)
- [ライセンス](#ライセンス)

## 概要

Kabutoは複雑な金融リサーチの質問を受け取り、明確なステップに分解して実行します。リアルタイムの市場データを使って各タスクを遂行し、自己検証を繰り返しながら、データに裏付けられた回答を導き出します。

**主な機能:**
- **インテリジェントなタスク計画**: 複雑なクエリを構造化されたリサーチステップに自動分解
- **自律的な実行**: 適切なツールを選択し、金融データを収集
- **自己検証**: 自身の分析結果をチェックし、タスク完了まで反復
- **リアルタイム金融データ**: J-Quants APIによる株価・財務諸表・決算情報へのアクセス
- **有価証券報告書の解析**: EDINET APIを通じた開示書類の取得と分析
- **日本市場特化**: 証券コード（4桁）対応、円建て分析、3月決算への対応
- **安全機能**: ループ検知とステップ制限による暴走防止

## Dexterからの変更点

[virattt/dexter](https://github.com/virattt/dexter) を日本株市場向けに再構築した際の主な変更点です。

### データソース

| 機能 | Dexter（原版） | Kabuto |
|---|---|---|
| 株価データ | Yahoo Finance / Polygon | J-Quants API（フォールバック: Stooq） |
| 財務諸表 | SEC EDGAR | J-Quants API（フォールバック: yahoo-finance2） |
| 銘柄マスタ | なし | J-Quants API（フォールバック: JPX公開Excel） |
| 有価証券報告書 | SEC EDGAR | EDINET API |

### プロバイダーパターン（フォールバック機構）

株価・財務諸表・銘柄マスタすべてにプロバイダー抽象層を実装しています。環境変数で動作を制御できます:

```bash
STOCK_PROVIDER=auto       # auto | jquants | stooq
FINANCE_PROVIDER=auto     # auto | jquants | yahoo
```

`auto`（デフォルト）では:
1. **J-Quants API** を優先使用（`JQUANTS_API_KEY` が設定されている場合）
2. キー未設定またはAPIエラー時は **yahoo-finance2** / **JPX公開Excel** へ自動フォールバック

J-Quantsなしでもエージェントが動作するため、APIキーなしでの試用が可能です。

### 追加ツール

- **`stock_screener`**: 自然言語による日本株スクリーニング（例:「PBR1倍以下で配当利回り3%以上」）
- **`get_financials`**: 日本株財務諸表取得（年次・四半期）
- **`edinet_search`** / **`edinet_document`**: 有価証券報告書の検索・取得
- **`x_search`**: X（Twitter）でのセンチメント調査

### その他

- **WhatsApp Gateway**: WhatsApp経由でエージェントにアクセス可能
- **評価スイート**: LangSmith + LLM-as-judgeによる日本株Q&A精度評価
- **証券コード対応**: 4桁コード（例: `7203`）、円建て分析、3月決算サポート

## 前提条件

- [Bun](https://bun.com) ランタイム（v1.0以上）
- LLM APIキー（OpenAI / Anthropic / Google など）
- [J-Quants APIキー](https://jpx-jquants.com/)（株価・財務データ）
- [EDINET APIキー](https://disclosure2.edinet-fsa.go.jp/)（有価証券報告書）
- [Exa APIキー](https://exa.ai)（オプション、Web検索用）

### Bunのインストール

**macOS / Linux:**
```bash
curl -fsSL https://bun.com/install | bash
```

**Windows:**
```bash
powershell -c "irm bun.sh/install.ps1|iex"
```

インストール後、ターミナルを再起動して確認:
```bash
bun --version
```

## インストール

1. リポジトリをクローン:
```bash
git clone https://github.com/oden41/kabuto.git
cd kabuto
```

2. 依存パッケージをインストール:
```bash
bun install
```

3. 環境変数を設定:
```bash
cp env.example .env
```

`.env` を編集してAPIキーを設定:
```bash
# LLM APIキー
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENAI_API_KEY=your-openai-api-key          # オプション

# 日本株データ
JQUANTS_API_KEY=your-jquants-api-key        # J-Quants API
EDINET_API_KEY=your-edinet-api-key          # EDINET API

# Web検索（Exa推奨、Tavily代替）
EXASEARCH_API_KEY=your-exa-api-key          # オプション
TAVILY_API_KEY=your-tavily-api-key          # オプション
```

## 使い方

インタラクティブモードで起動:
```bash
bun start
```

開発時（ウォッチモード）:
```bash
bun dev
```

**質問の例:**
```
トヨタ(7203)の直近3年間の売上と営業利益の推移を分析して
PBRが1倍以下の東証プライム銘柄をスクリーニングして
ソフトバンクグループの有価証券報告書からリスク要因を読んで
```

## 評価

Kabutoには、日本株の金融質問に対するエージェントの精度を測定する評価スイートが含まれています。LangSmithでトラッキングし、LLM-as-judgeアプローチでスコアリングします。

**全問実行:**
```bash
bun run src/evals/run.ts
```

**ランダムサンプリング:**
```bash
bun run src/evals/run.ts --sample 10
```

## デバッグ

Kabutoは全てのツール呼び出しをスクラッチパッドファイルに記録します。各クエリごとに `.kabuto/scratchpad/` にJSONLファイルが作成されます。

```
.kabuto/scratchpad/
├── 2026-03-26-111400_9a8f10723f79.jsonl
├── 2026-03-26-143022_a1b2c3d4e5f6.jsonl
└── ...
```

各ファイルには以下が記録されます:
- **init**: 元のクエリ
- **tool_result**: ツール呼び出しの引数、結果、LLMによる要約
- **thinking**: エージェントの推論ステップ

## WhatsApp連携

WhatsAppを通じてKabutoとチャットできます。

```bash
# WhatsAppアカウントをリンク（QRコードをスキャン）
bun run gateway:login

# ゲートウェイを起動
bun run gateway
```

詳細は [WhatsApp Gateway README](src/gateway/channels/whatsapp/README.md) を参照してください。

## コントリビュート

1. リポジトリをフォーク
2. フィーチャーブランチを作成
3. 変更をコミット
4. ブランチにプッシュ
5. プルリクエストを作成

PRは小さく、焦点を絞った内容にしてください。

## ライセンス

MIT License

本プロジェクトは [virattt/dexter](https://github.com/virattt/dexter)（MIT License, Copyright © virattt）をフォークし、日本株市場向けに改変したものです。

---

# Kabuto 兜 (English)

An autonomous AI financial research agent specialized for the Japanese stock market. It automatically conducts investment research through cycles of planning, execution, and validation.

> **Note**: This project is forked from [virattt/dexter](https://github.com/virattt/dexter) and rebuilt for the Japanese equity market. It leverages Dexter's excellent agent architecture while optimizing data sources, prompts, and investment philosophy for Japan.

The name "Kabuto" comes from Kabutocho, Tokyo's historic financial district — Japan's equivalent of Wall Street.

## Overview

Kabuto takes complex financial research questions and breaks them into clear, step-by-step plans. It executes each task using real-time market data, validates its own work, and iterates until it has a confident, data-backed answer.

**Key Capabilities:**
- **Intelligent Task Planning**: Automatically decomposes complex queries into structured research steps
- **Autonomous Execution**: Selects and executes the right tools to gather financial data
- **Self-Validation**: Checks its own work and iterates until tasks are complete
- **Real-Time Japanese Market Data**: Access to stock prices, financial statements, and earnings via J-Quants API
- **Securities Report Analysis**: Retrieval and analysis of disclosure documents via EDINET API
- **Japan-Specific**: 4-digit stock codes, JPY-denominated analysis, March fiscal year support
- **Safety Features**: Built-in loop detection and step limits to prevent runaway execution

## Changes from Dexter

Key changes from [virattt/dexter](https://github.com/virattt/dexter) when rebuilding for the Japanese equity market:

### Data Sources

| Feature | Dexter (original) | Kabuto |
|---|---|---|
| Stock prices | Yahoo Finance / Polygon | J-Quants API (fallback: Stooq) |
| Financial statements | SEC EDGAR | J-Quants API (fallback: yahoo-finance2) |
| Company master | — | J-Quants API (fallback: JPX public Excel) |
| Disclosure documents | SEC EDGAR | EDINET API |

### Provider Pattern (Fallback Mechanism)

All data layers (stock prices, financials, company master) use a provider abstraction with environment variable control:

```bash
STOCK_PROVIDER=auto       # auto | jquants | stooq
FINANCE_PROVIDER=auto     # auto | jquants | yahoo
```

In `auto` mode (default):
1. **J-Quants API** is tried first (when `JQUANTS_API_KEY` is set)
2. On missing key or API failure, automatically falls back to **yahoo-finance2** / **JPX public Excel**

The agent works without a J-Quants key, making it easy to try without subscriptions.

### Additional Tools

- **`stock_screener`**: Natural-language stock screening (e.g. "PBR below 1x with dividend yield above 3%")
- **`get_financials`**: Japanese stock financials (annual & quarterly)
- **`edinet_search`** / **`edinet_document`**: Securities report search & retrieval
- **`x_search`**: Sentiment research via X (Twitter)

### Other

- **WhatsApp Gateway**: Chat with the agent via WhatsApp
- **Evaluation suite**: Japanese-market Q&A accuracy via LangSmith + LLM-as-judge
- **Japan-specific**: 4-digit stock codes (e.g. `7203`), JPY-denominated analysis, March fiscal year support

## Prerequisites

- [Bun](https://bun.com) runtime (v1.0 or higher)
- LLM API key (OpenAI / Anthropic / Google, etc.)
- [J-Quants API key](https://jpx-jquants.com/) (stock prices & financials)
- [EDINET API key](https://disclosure2.edinet-fsa.go.jp/) (securities reports)
- [Exa API key](https://exa.ai) — optional, for web search

## Quick Start

```bash
git clone https://github.com/oden41/kabuto.git
cd kabuto
bun install
cp env.example .env
# Edit .env with your API keys
bun start
```

**Example queries:**
```
Analyze Toyota's (7203) revenue and operating profit trends over the past 3 years
Screen TSE Prime stocks with PBR below 1x
Read the risk factors from SoftBank Group's securities report
```

For full documentation, see the Japanese sections above.

## License

MIT License

This project is a fork of [virattt/dexter](https://github.com/virattt/dexter) (MIT License, Copyright © virattt), modified for the Japanese equity market.
