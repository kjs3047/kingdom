import type { UserRequest } from './types';

export const sampleRequests: UserRequest[] = [
  {
    message: '텔레그램 챗봇 기반으로 나랏말 AI 왕국을 실제 구축해줘.',
    attachments: ['spec.docx'],
    externalDelivery: false,
    sensitive: false,
  },
  {
    message: '이 기획안을 투자자용 발표 자료와 소개 문구로 바꿔줘.',
    externalDelivery: true,
    sensitive: false,
  },
  {
    message: '민감한 운영 정책 문서를 검토하고 리스크를 찾아줘.',
    externalDelivery: false,
    sensitive: true,
  },
];
