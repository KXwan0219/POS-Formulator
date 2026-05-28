/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CalculationMode = 'inclusive' | 'exclusive';
export type DiscountType = 'percentage' | 'fixed';
export type SurchargeType = 'percentage' | 'fixed';
export type TakeAwayType = 'perItem' | 'fullBill';
export type NotationStyle = 'math' | 'code' | 'excel' | 'english';

export interface PosComponent {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  color: string; // Tailwind color class scheme (e.g., 'emerald')
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeClass: string;
}

export interface FormulatorSettings {
  // Subtotal Settings
  subtotalLabel: string;
  
  // Discount Settings
  discountType: DiscountType;
  discountValue: number;
  discountLabel: string;
  
  // Surcharge Settings
  surchargeType: SurchargeType;
  surchargeValue: number;
  surchargeLabel: string;
  surchargeIncludesDiscount: boolean;
  
  // Service Charge Settings
  serviceChargeValue: number;
  serviceChargeLabel: string;
  serviceChargeIncludesDiscount: boolean;
  serviceChargeIncludesSurcharge: boolean;
  
  // Tax Settings
  taxMode: CalculationMode;
  taxValue: number;
  taxLabel: string;
  taxIncludesServiceCharge: boolean;
  taxIncludesSurcharge: boolean;
  
  // Service Tax Settings
  serviceTaxValue: number;
  serviceTaxLabel: string; // e.g. "SST" or "Tax on Service Charge"
  
  // Take Away Settings
  takeAwayType: TakeAwayType;
  takeAwayValue: number;
  takeAwayLabel: string;
  scOnTakeAway: boolean;
  taxOnTakeAway: boolean;
  
  // Voucher Settings
  voucherValue: number;
  voucherLabel: string;
}
