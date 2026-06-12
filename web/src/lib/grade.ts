import type { UserGrade } from "@/lib/types/database";

export const GRADE_LABEL: Record<UserGrade, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
  vip: "VIP",
};

export const GRADE_KO: Record<UserGrade, string> = {
  bronze: "브론즈",
  silver: "실버",
  gold: "골드",
  vip: "VIP",
};

/** 등급별 적립률 (구매액 대비) */
export const GRADE_EARN_RATE: Record<UserGrade, number> = {
  bronze: 0.01,
  silver: 0.02,
  gold: 0.03,
  vip: 0.05,
};
