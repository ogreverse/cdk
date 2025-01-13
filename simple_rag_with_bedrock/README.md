# simple RAG with Bedrock

## Concept

Bedrock を使った簡易な RAG 環境の構築

## Setup

### .envファイルの準備

.env.example をコピーして .env を作成し、環境変数の値を変更してください。

## Commands

- `npm run build`
  - TypeScript を JS にコンパイル
- `npm run watch`
  - 変更を監視しコンパイル
- `npm run test`
  - Jest ユニットテストを実行
- `npx cdk deploy`
  - このスタックをデフォルトの AWS アカウント/リージョンにデプロイ
- `npx cdk diff`
  - デプロイされたスタックと現在の状態を比較
- `npx cdk synth`
  - 合成された CloudFormation テンプレートを出力
