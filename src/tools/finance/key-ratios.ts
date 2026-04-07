/**
 * 投資指標計算ツール。
 * fetchFinancialSummary (J-Quants / Yahoo フォールバック) と
 * fetchLatestPrice (J-Quants / Stooq フォールバック) を使って
 * PER・PBR・ROE・ROA・配当利回りを算出。
 */
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { formatToolResult } from '../types.js';
import { fetchFinancialSummary } from './providers/fundamentals.js';
import { fetchLatestPrice } from './providers/index.js';

const KeyRatiosInputSchema = z.object({
  code: z
    .string()
    .describe("銘柄の証券コード（4桁）。例: '7203' はトヨタ自動車。"),
});

export const getKeyRatios = new DynamicStructuredTool({
  name: 'get_key_ratios',
  description:
    '日本株の主要投資指標スナップショットを取得します。PER・PBR・ROE・ROA・配当利回り・自己資本比率などを含みます。東証PBR改革の観点からPBRに特に注目。',
  schema: KeyRatiosInputSchema,
  func: async (input) => {
    const code = input.code.trim().padStart(4, '0');

    const [{ records, url: finUrl }, { price, url: priceUrl }] = await Promise.all([
      fetchFinancialSummary(code, 'annual', 1),
      fetchLatestPrice(code),
    ]);

    const latest = records[0];
    if (!latest) {
      return formatToolResult({ error: `証券コード ${code} の財務データが見つかりません` }, [finUrl]);
    }

    const eps = latest.eps ?? 0;
    const bps = latest.bps ?? 0;
    const divAnn = latest.dividendPerShare ?? 0;
    const netIncome = latest.netIncome ?? 0;
    const equity = latest.equity ?? 0;
    const totalAssets = latest.totalAssets ?? 0;
    const sales = latest.netSales ?? 0;
    const opProfit = latest.operatingProfit ?? 0;
    // equityToAssetRatio は % 形式で格納済み（40.0 = 40%）
    const equityToAssetRatio = latest.equityToAssetRatio;

    const per = price && eps > 0 ? price / eps : null;
    const pbr = price && bps > 0 ? price / bps : null;
    const dividendYield = price && divAnn > 0 ? (divAnn / price) * 100 : null;
    const roe = equity > 0 ? (netIncome / equity) * 100 : null;
    const roa = totalAssets > 0 ? (netIncome / totalAssets) * 100 : null;
    const operatingMargin = sales > 0 ? (opProfit / sales) * 100 : null;

    const ratios = {
      code,
      fiscalYearEnd: latest.fiscalYearEnd,
      disclosureDate: latest.disclosureDate,
      price: price ? Math.round(price) : null,
      per: per ? Math.round(per * 10) / 10 : null,
      pbr: pbr ? Math.round(pbr * 100) / 100 : null,
      dividendYield: dividendYield ? Math.round(dividendYield * 100) / 100 : null,
      roe: roe ? Math.round(roe * 10) / 10 : null,
      roa: roa ? Math.round(roa * 10) / 10 : null,
      operatingMargin: operatingMargin ? Math.round(operatingMargin * 10) / 10 : null,
      equityRatio: equityToAssetRatio ? Math.round(equityToAssetRatio * 10) / 10 : null,
      eps: Math.round(eps * 10) / 10,
      bps: bps ? Math.round(bps) : null,
      dividendPerShare: divAnn,
      // TSE reform flag: TSEはPBR1倍割れ企業に改善要求
      pbrBelowOne: pbr !== null && pbr < 1.0,
    };

    const urls = [finUrl, priceUrl].filter(Boolean);
    return formatToolResult(ratios, urls);
  },
});

const HistoricalKeyRatiosInputSchema = z.object({
  code: z
    .string()
    .describe("銘柄の証券コード（4桁）。例: '7203' はトヨタ自動車。"),
  period: z
    .enum(['annual', 'quarterly'])
    .default('annual')
    .describe("'annual' は通期、'quarterly' は四半期。"),
  limit: z
    .number()
    .default(5)
    .describe('取得する期数の上限（デフォルト5）。'),
});

export const getHistoricalKeyRatios = new DynamicStructuredTool({
  name: 'get_historical_key_ratios',
  description: '日本株の過去の投資指標推移を取得します。EPS・BPS・配当・ROE・利益率などの時系列データ。',
  schema: HistoricalKeyRatiosInputSchema,
  func: async (input) => {
    const code = input.code.trim().padStart(4, '0');
    const { records, url } = await fetchFinancialSummary(code, input.period, input.limit);

    const result = records.map((s) => {
      const netIncome = s.netIncome ?? 0;
      const equity = s.equity ?? 0;
      const totalAssets = s.totalAssets ?? 0;
      const sales = s.netSales ?? 0;
      const opProfit = s.operatingProfit ?? 0;
      return {
        fiscalYearEnd: s.fiscalYearEnd,
        period: s.period,
        eps: s.eps,
        bps: s.bps,
        dividendPerShare: s.dividendPerShare,
        roe: equity > 0 ? Math.round((netIncome / equity) * 1000) / 10 : null,
        roa: totalAssets > 0 ? Math.round((netIncome / totalAssets) * 1000) / 10 : null,
        operatingMargin: sales > 0 ? Math.round((opProfit / sales) * 1000) / 10 : null,
        // equityToAssetRatio は % 形式で格納済み（40.0 = 40%）
        equityRatio: s.equityToAssetRatio ? Math.round(s.equityToAssetRatio * 10) / 10 : null,
        netSales: s.netSales,
        operatingProfit: s.operatingProfit,
        ordinaryProfit: s.ordinaryProfit,
        netIncome: s.netIncome,
      };
    });

    return formatToolResult(result, [url]);
  },
});
