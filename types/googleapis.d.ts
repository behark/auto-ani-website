declare module 'googleapis' {
  export interface Auth {
    OAuth2: any;
    GoogleAuth: any;
  }

  export interface Calendar {
    calendars: {
      insert: (params: any) => Promise<any>;
    };
    calendarList: {
      list: () => Promise<any>;
    };
    events: {
      insert: (params: any) => Promise<any>;
      update: (params: any) => Promise<any>;
      delete: (params: any) => Promise<any>;
      list: (params: any) => Promise<any>;
      get: (params: any) => Promise<any>;
    };
  }

  export const google: {
    auth: Auth;
    calendar: (options: any) => Calendar;
  };
}