import Axios, { AxiosInstance } from 'axios';
// TODO: Reorganize thomasio-auth-js-common.
import { ISession } from 'thomasio-auth-js-common/lib/server';

// TODO: Implement support for clients that do not support logging in or registering users.
export class AuthClient<E, I, U> {
	private readonly loginUrl: string;
	private readonly registerUrl: string;

	private state: { loggedIn: false } | { loggedIn: true; session: ISession<I> } = { loggedIn: false };

	public get loggedIn() {
		return this.state.loggedIn;
	}

	public get identity() {
		if (this.state.loggedIn) {
			return this.state.session.identity;
		} else {
			// TODO: Implement proper errors.
			throw Error("You tried to access AuthClient.identity whilst you weren't logged in!");
		}
	}

	constructor(loginUrl: string, registerUrl: string) {
		this.loginUrl = loginUrl;
		this.registerUrl = registerUrl;
	}

	public async login(username: string, password: string, axiosInstance: AxiosInstance = Axios): Promise<boolean> {
		// TODO: Implement a shared codebase to, for example, share UserAuthenticator's return type.
		const response = await axiosInstance.post<{ valid: false } | { valid: true; session: ISession<I> }>(this.loginUrl, {
			username,
			/* tslint:disable-next-line */
			password,
		});

		switch (response.status) {
			case 200:
				// TODO: Possibly rename 'valid' to 'loggedIn'
				this.state = response.data.valid
					? {
							loggedIn: true,
							session: response.data.session,
					  }
					: {
							loggedIn: false,
					  };

				return this.loggedIn;
			case 400:
				// TODO: Implement proper errors.
				throw Error(
					'Either username or password were probably not a string. If this is not the case, please contact us on GitHub!',
				);
			default:
				// TODO: Implement proper errors.
				throw Error(
					`The server returned status ${response.status} which it shouldn't. Please tell us about this error on GitHub!`,
				);
		}
	}

	public async register(
		username: string,
		password: string,
		userData: U,
		axiosInstance: AxiosInstance = Axios,
	): Promise<{ success: true; identity: I } | { success: false; error: E }> {
		// TODO: Implement a shared codebase to, for example, share UserCreator's return type.
		const response = await axiosInstance.post<{ success: true; identity: I } | { success: false; error: E }>(
			this.loginUrl,
			{
				username,
				/* tslint:disable-next-line */
				password,
			},
		);

		switch (response.status) {
			case 200:
				return response.data;
			case 400:
				// TODO: Implement proper errors.
				throw Error(
					'Either username or password were probably not a string, otherwhise userData might be invalid. If this is not the case, please contact us on GitHub!',
				);
			default:
				// TODO: Implement proper errors.
				throw Error(
					`The server returned status ${response.status} which it shouldn't. Please tell us about this error on GitHub!`,
				);
		}
	}

	public async logout() {
		// TODO: Implement server-side logging out.
		this.state = { loggedIn: false };
	}

	// TODO: Support non-authenticated requests with injected Axios instances.
	public inject(axiosInstance: AxiosInstance = Axios) {
		return axiosInstance.interceptors.request.use(config => {
			if (this.state.loggedIn) {
				config.headers['X-Session-Id'] = this.state.session.id;
				config.headers['X-Session-Token'] = this.state.session.token;

				return config;
			} else {
				// TODO: Implement proper errors.
				throw Error("You tried to make an authenticated request whilst you weren't logged in!");
			}
		});
	}
}
