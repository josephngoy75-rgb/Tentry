import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'home': { paramsTuple?: []; params?: {} }
    'offers.index': { paramsTuple?: []; params?: {} }
    'offers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'application.create': { paramsTuple?: []; params?: {} }
    'application.store': { paramsTuple?: []; params?: {} }
    'thanks': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'account': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'company.offers.index': { paramsTuple?: []; params?: {} }
    'company.offers.create': { paramsTuple?: []; params?: {} }
    'company.offers.store': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'dashboard.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  GET: {
    'home': { paramsTuple?: []; params?: {} }
    'offers.index': { paramsTuple?: []; params?: {} }
    'offers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'application.create': { paramsTuple?: []; params?: {} }
    'thanks': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'account': { paramsTuple?: []; params?: {} }
    'company.offers.index': { paramsTuple?: []; params?: {} }
    'company.offers.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  HEAD: {
    'home': { paramsTuple?: []; params?: {} }
    'offers.index': { paramsTuple?: []; params?: {} }
    'offers.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'application.create': { paramsTuple?: []; params?: {} }
    'thanks': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'account': { paramsTuple?: []; params?: {} }
    'company.offers.index': { paramsTuple?: []; params?: {} }
    'company.offers.create': { paramsTuple?: []; params?: {} }
    'dashboard': { paramsTuple?: []; params?: {} }
    'dashboard.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  POST: {
    'application.store': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'company.offers.store': { paramsTuple?: []; params?: {} }
    'dashboard.update_status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}