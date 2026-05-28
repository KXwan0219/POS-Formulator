/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FormulaToken {
  type: 'text' | 'variable';
  value: string;
  stepId?: string;
}

export interface FormulaStep {
  id: string;
  name: string;
  tokens: FormulaToken[];
}

interface StepDefinition {
  id: string;
  name: string;
  active: boolean;
  parts: (string | null | false)[];
}

function getInclusiveDefs(mod: Set<string>): StepDefinition[] {
  const d = (id: string, name: string, active: boolean, parts: (string | null | false)[]) => ({ id, name, active, parts });

  const takeAwayParts = [];
  if (mod.has('takeAwayFull')) takeAwayParts.push('Take Away Fees (Full Bill)');
  if (mod.has('takeAwayItem')) takeAwayParts.push('Σ(Take Away Fees Per Item × Qty)');

  const finalAdjParts = [];
  if (mod.has('voucher')) finalAdjParts.push('− Voucher');
  if (mod.has('point')) finalAdjParts.push('− Point Redemption');
  if (mod.has('deliveryFee')) finalAdjParts.push('+ Delivery Fees');

  const scBaseParts = [];
  if (mod.has('serviceChargeInclDiscount')) {
    scBaseParts.push('({AdjustedSubtotal} − {TaxInclusivePortion})');
  } else {
    scBaseParts.push('{SubtotalBeforeTax}');
  }
  if (mod.has('serviceChargeTakeAway')) {
    if (takeAwayParts.length > 0) {
      scBaseParts.push('+ ' + takeAwayParts.join(' + '));
    }
  }
  let scBaseInner = scBaseParts.join(' ');
  if (scBaseParts.length > 1) {
    scBaseInner = `( ${scBaseInner} )`;
  }

  const tdParts = [];
  if (mod.has('productDiscount')) tdParts.push('({ProductDiscountBase} + {ProductDiscountTax})');
  if (mod.has('fullBillDiscount')) tdParts.push('{FullBillDiscount}');

  const tpParts = [];
  if (mod.has('productPromotion')) tpParts.push('({ProductPromotionBase} + {ProductPromotionTax})');
  if (mod.has('fullBillPromotion')) tpParts.push('{FullBillPromotion}');

  return [
    d('BasePricePortion', 'Base Price Portion', true, ['((Item Price Tax Inclusive ÷ (1 + Tax Rate)) × Qty)']),
    d('TaxPortion', 'Tax Portion', true, ['((Item Price Tax Inclusive − (Item Price Tax Inclusive ÷ (1 + Tax Rate))) × Qty)']),
    d('ProductDiscountBase', 'Product Discount (Base Portion)', mod.has('productDiscount'), ['[(({BasePricePortion}) × Product Discount %) OR Product Discount Amount]']),
    d('ProductDiscountTax', 'Product Discount (Tax Portion)', mod.has('productDiscount'), ['[(({TaxPortion}) × Product Discount %) OR (Product Discount Amount × Tax Rate)]']),
    d('ProductPromotionBase', 'Product Promotion (Base Portion)', mod.has('productPromotion'), ['[(({BasePricePortion}) × Product Promotion %) OR Product Promotion Amount]']),
    d('ProductPromotionTax', 'Product Promotion (Tax Portion)', mod.has('productPromotion'), ['[(({TaxPortion}) × Product Promotion %) OR (Product Promotion Amount × Tax Rate)]']),
    d('NetBasePortion', 'Net Base Portion', true, [
      '{BasePricePortion}',
      mod.has('productDiscount') && '− {ProductDiscountBase}',
      mod.has('productPromotion') && '− {ProductPromotionBase}'
    ]),
    d('NetTaxPortion', 'Net Tax Portion', true, [
      '{TaxPortion}',
      mod.has('productDiscount') && '− {ProductDiscountTax}',
      mod.has('productPromotion') && '− {ProductPromotionTax}'
    ]),
    d('SubtotalBeforeTax', 'Subtotal Before Tax', true, ['Σ({NetBasePortion})']),
    d('SubtotalTaxPortion', 'Subtotal Tax Portion', true, ['Σ({NetTaxPortion})']),
    d('Subtotal', 'Subtotal', true, ['{SubtotalBeforeTax} + {SubtotalTaxPortion}']),
    d('FullBillDiscountBeforeTax', 'Full Bill Discount Before Tax', mod.has('fullBillDiscount'), [
      '(( {SubtotalBeforeTax} × Full Bill Discount %) OR Full Bill Discount Amount Before Tax)'
    ]),
    d('FullBillDiscountTaxPortion', 'Full Bill Discount Tax Portion', mod.has('fullBillDiscount'), [
      '(( {SubtotalTaxPortion} × Full Bill Discount %) OR Full Bill Discount Tax Amount)'
    ]),
    d('FullBillDiscount', 'Full Bill Discount', mod.has('fullBillDiscount'), [
      '{FullBillDiscountBeforeTax} + {FullBillDiscountTaxPortion}'
    ]),
    d('FullBillPromotionBeforeTax', 'Full Bill Promotion Discount Before Tax', mod.has('fullBillPromotion'), [
      '(( {SubtotalBeforeTax} × Full Bill Promotion Discount %) OR Full Bill Promotion Discount Amount Before Tax)'
    ]),
    d('FullBillPromotionTaxPortion', 'Full Bill Promotion Discount Tax Portion', mod.has('fullBillPromotion'), [
      '(( {SubtotalTaxPortion} × Full Bill Promotion Discount %) OR Full Bill Promotion Discount Tax Amount)'
    ]),
    d('FullBillPromotion', 'Full Bill Promotion Discount', mod.has('fullBillPromotion'), [
      '{FullBillPromotionBeforeTax} + {FullBillPromotionTaxPortion}'
    ]),
    d('TotalDiscount', 'Total Discount', mod.has('productDiscount') || mod.has('fullBillDiscount'), [
      tdParts.join(' + ')
    ]),
    d('TotalPromotion', 'Total Promotion', mod.has('productPromotion') || mod.has('fullBillPromotion'), [
      tpParts.join(' + ')
    ]),
    d('AdjustedSubtotal', 'Adjusted Subtotal', true, [
      '{Subtotal}',
      mod.has('fullBillDiscount') && '− {FullBillDiscount}',
      mod.has('fullBillPromotion') && '− {FullBillPromotion}'
    ]),
    d('SurchargeBase', 'Surcharge Base', mod.has('surcharge'), [
      mod.has('surchargeInclDiscount') ? '{AdjustedSubtotal}' : '{Subtotal}'
    ]),
    d('Surcharge', 'Surcharge', mod.has('surcharge'), ['{SurchargeBase} × Surcharge Rate']),
    d('TaxInclusivePortion', 'Tax Inclusive Portion', true, ['{Subtotal} − {SubtotalBeforeTax}']),
    d('ServiceChargeBase', 'Service Charge Base', mod.has('serviceCharge'), [
      `${scBaseInner} × Service Charge Rate`
    ]),
    d('ServiceChargeTax', 'Service Charge Tax', mod.has('serviceCharge') && mod.has('serviceChargeTax'), [
      '{ServiceChargeBase} × Service Charge Tax Rate'
    ]),
    d('ServiceCharge', 'Service Charge', mod.has('serviceCharge'), [
      '{ServiceChargeBase}',
      mod.has('serviceChargeTax') && '+ {ServiceChargeTax}'
    ]),
    d('FinalAdjustment', 'Final Adjustment', finalAdjParts.length > 0, [
      finalAdjParts.join(' ')
    ]),
    d('GrandTotal', 'Grand Total', true, [
      '{AdjustedSubtotal}',
      mod.has('surcharge') && '+ {Surcharge}',
      mod.has('serviceCharge') && '+ {ServiceCharge}',
      takeAwayParts.length > 0 && '+ ' + takeAwayParts.join(' + '),
      finalAdjParts.length > 0 && (finalAdjParts[0].startsWith('+') ? `+ {FinalAdjustment}` : ` {FinalAdjustment}`)
    ])
  ];
}

function getExclusiveDefs(mod: Set<string>): StepDefinition[] {
  const d = (id: string, name: string, active: boolean, parts: (string | null | false)[]) => ({ id, name, active, parts });

  const takeAwayParts = [];
  if (mod.has('takeAwayFull')) takeAwayParts.push('Take Away Fees (Full Bill)');
  if (mod.has('takeAwayItem')) takeAwayParts.push('Σ(Take Away Fees Per Item × Qty)');

  const adjSubVoucherPoint = [];
  if (mod.has('voucher')) adjSubVoucherPoint.push('− Voucher');
  if (mod.has('point')) adjSubVoucherPoint.push('− Point Redemption');

  const scBaseParts = [];
  if (mod.has('serviceChargeInclDiscount')) {
    scBaseParts.push('{AdjustedSubtotal}');
  } else {
    scBaseParts.push('{BaseItemSubtotal}');
  }
  if (mod.has('serviceChargeTakeAway')) {
    if (takeAwayParts.length > 0) {
      scBaseParts.push('+ ' + takeAwayParts.join(' + '));
    }
  }
  let scBaseInner = scBaseParts.join(' ');
  if (scBaseParts.length > 1) {
    scBaseInner = `( ${scBaseInner} )`;
  }

  const tdParts = [];
  if (mod.has('productDiscount')) tdParts.push('{ProductDiscount}');
  if (mod.has('fullBillDiscount')) tdParts.push('{FullBillDiscount}');

  const tpParts = [];
  if (mod.has('productPromotion')) tpParts.push('{ProductPromotion}');
  if (mod.has('fullBillPromotion')) tpParts.push('{FullBillPromotionDiscount}');

  return [
    d('BaseItemSubtotal', 'Base Item Subtotal', true, ['Σ(Item Price Before Tax × Qty)']),
    d('ProductDiscount', 'Product Discount', mod.has('productDiscount'), [
      '[({BaseItemSubtotal} × Product Discount %) OR Product Discount Amount]'
    ]),
    d('ProductPromotion', 'Product Promotion', mod.has('productPromotion'), [
      '[({BaseItemSubtotal} × Product Promotion %) OR Product Promotion Amount]'
    ]),
    d('ItemNetTotal', 'Item Net Total', true, [
      '{BaseItemSubtotal}',
      mod.has('productDiscount') && '− {ProductDiscount}',
      mod.has('productPromotion') && '− {ProductPromotion}'
    ]),
    d('FullBillDiscount', 'Full Bill Discount', mod.has('fullBillDiscount'), [
      '({ItemNetTotal} × Full Bill Discount %) OR Full Bill Discount Amount'
    ]),
    d('FullBillPromotionDiscount', 'Full Bill Promotion Discount', mod.has('fullBillPromotion'), [
      '({ItemNetTotal} × Full Bill Promotion Discount %) OR Full Bill Promotion Discount Amount'
    ]),
    d('TotalDiscount', 'Total Discount', mod.has('productDiscount') || mod.has('fullBillDiscount'), [
      tdParts.join(' + ')
    ]),
    d('TotalPromotion', 'Total Promotion', mod.has('productPromotion') || mod.has('fullBillPromotion'), [
      tpParts.join(' + ')
    ]),
    d('AdjustedSubtotal', 'Adjusted Subtotal', true, [
      '{ItemNetTotal}',
      mod.has('fullBillDiscount') && '− {FullBillDiscount}',
      mod.has('fullBillPromotion') && '− {FullBillPromotionDiscount}'
    ]),
    d('SurchargeBase', 'Surcharge Base', mod.has('surcharge'), [
      mod.has('surchargeInclDiscount') ? '{AdjustedSubtotal}' : '{BaseItemSubtotal}'
    ]),
    d('Surcharge', 'Surcharge', mod.has('surcharge'), [
      '{SurchargeBase} × Surcharge Rate'
    ]),
    d('ServiceChargeBase', 'Service Charge Base', mod.has('serviceCharge'), [
      `${scBaseInner} × Service Charge Rate`
    ]),
    d('ServiceChargeTax', 'Service Charge Tax', mod.has('serviceCharge') && mod.has('serviceChargeTax'), [
      '{ServiceChargeBase} × Service Charge Tax Rate'
    ]),
    d('TotalServiceCharge', 'Total Service Charge', mod.has('serviceCharge'), [
      '{ServiceChargeBase}',
      mod.has('serviceChargeTax') && '+ {ServiceChargeTax}'
    ]),
    d('TaxExclusive', 'Tax Exclusive', true, [
      '( {AdjustedSubtotal}',
      mod.has('surcharge') && '+ {Surcharge}',
      mod.has('serviceCharge') && '+ {TotalServiceCharge}',
      mod.has('takeAwayItem') && '+ Σ(Take Away Fees Per Item × Qty)',
      ') × Tax Rate'
    ]),
    d('GrandTotal', 'Grand Total', true, [
      '{AdjustedSubtotal}',
      mod.has('surcharge') && '+ {Surcharge}',
      mod.has('serviceCharge') && '+ {TotalServiceCharge}',
      '+ {TaxExclusive}',
      mod.has('takeAwayFull') && '+ Take Away Fees (Full Bill)',
      mod.has('takeAwayItem') && '+ Σ(Take Away Fees Per Item × Qty)',
      mod.has('deliveryFee') && '+ Delivery Fees',
      mod.has('voucher') && '− Voucher',
      mod.has('point') && '− Point Redemption'
    ])
  ];
}

export function generateAlgebraicFormula(
  taxMode: 'inclusive' | 'exclusive',
  activeModifiers: Set<string>
): Record<string, FormulaStep> {
  const defs = taxMode === 'inclusive' ? getInclusiveDefs(activeModifiers) : getExclusiveDefs(activeModifiers);
  
  const activeDefs: Record<string, StepDefinition> = {};
  for (const def of defs) {
    if (def.active) activeDefs[def.id] = def;
  }

  const result: Record<string, FormulaStep> = {};
  
  for (const [id, def] of Object.entries(activeDefs)) {
    const template = def.parts.filter(Boolean).join(' ');
    
    const tokens: FormulaToken[] = [];
    const regex = /\{(\w+)\}/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      if (match.index > lastIndex) {
        tokens.push({ type: 'text', value: template.substring(lastIndex, match.index) });
      }
      const refId = match[1];
      if (activeDefs[refId]) {
        tokens.push({ type: 'variable', value: activeDefs[refId].name, stepId: refId });
      } else {
        tokens.push({ type: 'text', value: refId });
      }
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < template.length) {
      tokens.push({ type: 'text', value: template.substring(lastIndex) });
    }

    result[id] = { id: def.id, name: def.name, tokens };
  }

  return result;
}
