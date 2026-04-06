# Design: /steps コマンド

**Date:** 2026-04-06
**Status:** Approved

## 概要

CLI で `/steps N` と入力することで、エージェントの最大イテレーション数（`maxIterations`）をセッション中に変更できるようにする。`/model` コマンドと同じパターンで実装する。

## 要件

- `/steps 20` のように数字を引数で渡して即時変更
- セッション内のみ有効（再起動で 10 に戻る）
- 現在のステップ数を intro の model 行の下に別行で表示
- 無効な入力はエラーメッセージで通知

## アーキテクチャ

変更ファイルは3つ。

### `src/controllers/agent-runner.ts`

- `private readonly agentConfig: AgentConfig` → `private agentConfig: AgentConfig` に変更
- `setMaxIterations(n: number): void` メソッドを追加:
  ```typescript
  setMaxIterations(n: number) {
    this.agentConfig = { ...this.agentConfig, maxIterations: n };
  }
  ```

### `src/cli.ts`

`/model` ハンドリングの直後に追加:

```typescript
if (query.startsWith('/steps')) {
  const parts = query.split(' ');
  const n = parseInt(parts[1] ?? '', 10);
  if (isNaN(n) || n < 1 || n > 100) {
    // エラー表示
  } else {
    agentRunner.setMaxIterations(n);
    intro.setSteps(n);
  }
  return;
}
```

`/steps`（引数なし）の場合は現在値を表示する。

### `src/components/intro.ts`

- `private readonly stepsText: Text` フィールドを追加（`modelText` の下）
- コンストラクタで初期値 10 を設定
- `setSteps(n: number)` メソッドを追加:
  ```typescript
  setSteps(n: number) {
    this.stepsText.setText(
      `${theme.muted('Steps: ')}${theme.primary(String(n))}${theme.muted('. Type /steps <n> to change.')}`,
    );
  }
  ```

## バリデーション

| 入力 | 動作 |
|---|---|
| `/steps 20` | maxIterations を 20 に設定、intro を更新 |
| `/steps` (引数なし) | 現在の値をチャットログに表示 |
| `/steps abc` | エラーメッセージ表示 |
| `/steps 0` または `/steps 101` | エラーメッセージ表示 |

エラーメッセージ: `/steps requires a number between 1 and 100 (e.g. /steps 20)`

## テスト

自動テストは追加しない（CLI インタラクション層のため）。手動確認項目:

- [ ] `/steps 20` → intro に `Steps: 20` が表示される
- [ ] `/steps abc` → エラーメッセージが出る
- [ ] 再起動後 → 10 に戻る（永続化されない）
- [ ] `/steps` 引数なし → 現在の値が表示される
