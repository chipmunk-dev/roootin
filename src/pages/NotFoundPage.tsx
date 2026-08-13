import { Link } from "react-router-dom";

export function NotFoundPage() {
  return <section><h1>페이지를 찾을 수 없습니다.</h1><Link to="/today">오늘로 돌아가기</Link></section>;
}
