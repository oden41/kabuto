# /steps コマンド Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** CLI で `/steps N` と入力することで、エージェントの最大イテレーション数をセッション中に変更できるようにする。

**Architecture:** `AgentRunnerController` に `setMaxIterations()` を追加し、`IntroComponent` に steps 表示行を追加、`cli.ts` で `/steps N` コマンドをハンドリングする。`/model` コマンドと同じパターンで実装する。自動テストなし（CLI インタラクション層のため）。

**Tech Stack:** TypeScript, Bun, pi-tui

---

## ファイルマップ

| ファイル | 変更種別 | 内容 |
|---|---|---|
| `src/controllers/agent-runner.ts` | Modify | `readonly` 削除、`setMaxIterations()` と `maxIterations` getter 追加 |
| `src/components/intro.ts` | Modify | `stepsText` フィールドと `setSteps()` メソッド追加 |
| `src/cli.ts` | Modify | `/steps N` コマンドハンドリング追加 |

---

## Task 1: AgentRunnerController に setMaxIterations() を追加

**Files:**
- Modify: `src/controllers/agent-runner.ts`

- [ ] **Step 1: `readonly` を削除し、getter と setter を追加**

`src/controllers/agent-runner.ts` の該当箇所を変更する:

```typescript
// 変更前 (line 23)
private readonly agentConfig: AgentConfig;

// 変更後
private agentConfig: AgentConfig;
```

`setError()` メソッド（line 62）の直後に以下を追加:

```typescript
get maxIterations(): number {
  return this.agentConfig.maxIterations ?? 10;
}

setMaxIterations(n: number) {
  this.agentConfig = { ...this.agentConfig, maxIterations: n };
}
```

- [ ] **Step 2: 型チェック**

```bash
cd //wsl.localhost/Ubuntu/home/shumpeim/kabuto && bun run typecheck
```

Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/controllers/agent-runner.ts
git commit -m "feat: add setMaxIterations() to AgentRunnerController"
```

---

## Task 2: IntroComponent に steps 表示行を追加

**Files:**
- Modify: `src/components/intro.ts`

- [ ] **Step 1: `stepsText` フィールドと `setSteps()` メソッドを追加**

`src/components/intro.ts` を以下のように変更する:

```typescript
export class IntroComponent extends Container {
  private readonly modelText: Text;
  private readonly stepsText: Text;  // 追加

  constructor(model: string) {
    super();

    // ... 既存のアスキーアートと welcome テキストはそのまま ...

    this.addChild(new Spacer(1));
    this.addChild(new Text('日本株市場に特化したAI金融リサーチエージェント', 0, 0));
    this.modelText = new Text('', 0, 0);
    this.addChild(this.modelText);
    this.stepsText = new Text('', 0, 0);  // 追加
    this.addChild(this.stepsText);         // 追加
    this.setModel(model);
    this.setSteps(10);                     // 追加（初期値 10）
  }

  setModel(model: string) {
    this.modelText.setText(
      `${theme.muted('Model: ')}${theme.primary(getModelDisplayName(model))}${theme.muted(
        '. Type /model to change.',
      )}`,
    );
  }

  setSteps(n: number) {  // 追加
    this.stepsText.setText(
      `${theme.muted('Steps: ')}${theme.primary(String(n))}${theme.muted('. Type /steps <n> to change.')}`,
    );
  }
}
```

- [ ] **Step 2: 型チェック**

```bash
cd //wsl.localhost/Ubuntu/home/shumpeim/kabuto && bun run typecheck
```

Expected: エラーなし

- [ ] **Step 3: Commit**

```bash
git add src/components/intro.ts
git commit -m "feat: add steps display to IntroComponent"
```

---

## Task 3: cli.ts に /steps コマンドハンドリングを追加

**Files:**
- Modify: `src/cli.ts`

- [ ] **Step 1: `/steps` コマンドハンドリングを追加**

`src/cli.ts` の `handleSubmit` 関数内、`/model` ブロック（`if (query === '/model') { ... }`）の直後に以下を追加:

```typescript
if (query.startsWith('/steps')) {
  const parts = query.trim().split(/\s+/);
  const n = parseInt(parts[1] ?? '', 10);
  if (isNaN(n) || n < 1 || n > 100) {
    lastError = `/steps requires a number between 1 and 100 (e.g. /steps 20)`;
    refreshError();
    tui.requestRender();
    return;
  }
  agentRunner.setMaxIterations(n);
  intro.setSteps(n);
  tui.requestRender();
  return;
}
```

追加後のブロック全体のイメージ:

```typescript
if (query === '/model') {
  modelSelection.startSelection();
  return;
}

if (query.startsWith('/steps')) {
  const parts = query.trim().split(/\s+/);
  const n = parseInt(parts[1] ?? '', 10);
  if (isNaN(n) || n < 1 || n > 100) {
    lastError = `/steps requires a number between 1 and 100 (e.g. /steps 20)`;
    refreshError();
    tui.requestRender();
    return;
  }
  agentRunner.setMaxIterations(n);
  intro.setSteps(n);
  tui.requestRender();
  return;
}

if (modelSelection.isInSelectionFlow() || agentRunner.pendingApproval || agentRunner.isProcessing) {
  return;
}
```

- [ ] **Step 2: 型チェック**

```bash
cd //wsl.localhost/Ubuntu/home/shumpeim/kabuto && bun run typecheck
```

Expected: エラーなし

- [ ] **Step 3: テスト（全テスト通過確認）**

```bash
cd //wsl.localhost/Ubuntu/home/shumpeim/kabuto && bun test
```

Expected: 53 tests passed

- [ ] **Step 4: Commit**

```bash
git add src/cli.ts
git commit -m "feat: add /steps command to change maxIterations at runtime"
```

---

## 手動確認チェックリスト

実装完了後、`bun start` で起動して以下を確認:

- [ ] 起動時に intro に `Steps: 10. Type /steps <n> to change.` が表示される
- [ ] `/steps 20` → intro が `Steps: 20` に更新される
- [ ] `/steps 20` 後にエージェントを動かすと 20 ステップまで実行する
- [ ] `/steps abc` → エラーメッセージ `/steps requires a number between 1 and 100 (e.g. /steps 20)` が表示される
- [ ] `/steps 0` → 同じエラーメッセージが表示される
- [ ] `/steps 101` → 同じエラーメッセージが表示される
- [ ] 再起動後 → `Steps: 10` に戻る（永続化されない）
