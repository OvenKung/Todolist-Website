import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Todo List - จัดการงานอย่างมีประสิทธิภาพ" },
    { name: "description", content: "เว็บไซต์จัดการงาน Todo List ที่ทันสมัยและใช้งานง่าย พร้อมระบบจัดลำดับความสำคัญ หมวดหมู่ และบันทึกข้อมูลอัตโนมัติ" },
  ];
}

export default function Home() {
  return <Welcome />;
}
