import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

 export function cn(...inputs: ClassValue[]) {
   return twMerge(clsx(inputs));
 }
 
 /** Formata segundos em mm:ss, aceita null/undefined */
 export function formatDuration(seconds: number | null | undefined): string {
   if (seconds === null || seconds === undefined || seconds < 0) return '0:00';
   const mins = Math.floor(seconds / 60);
   const secs = Math.floor(seconds % 60);
   return `${mins}:${secs.toString().padStart(2, '0')}`;
 }
 
 /** Formata moeda em BRL */
 export function formatCurrency(value: number): string {
   return new Intl.NumberFormat('pt-BR', {
     style: 'currency',
     currency: 'BRL',
   }).format(value);
 }
 
 /** Formata número com separadores de milhar */
 export function formatNumber(value: number): string {
   return new Intl.NumberFormat('pt-BR').format(value);
 }
