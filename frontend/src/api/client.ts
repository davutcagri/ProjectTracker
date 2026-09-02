import axios from 'axios'

/*
  Merkezi axios örneği. Tüm API çağrıları bunun üzerinden gider.
  baseURL '/api' — geliştirmede Vite proxy'si :8420'ye iletir,
  pakette ise SPA ile aynı origin'den (Spring Boot) servis edilir.
*/
export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})
