require("dotenv").config();
console.log(process.env)

const googleClientId = process.env.googleClientId;
const googleClientSecret = process.env.googleClientSecret;
const redirectUri = process.env.redirectUri;
const facebookAppId = process.env.facebookAppId;
const facebookAppSecret = process.env.facebookAppSecret;
const redirectUriFaceBook = process.env.redirectUriFaceBook;
const githubAppId = process.env.githubAppId;
const githubAppSecret = process.env.githubAppSecret;
const redirectUrigithub = process.env.redirectUrigithub;

const express = require("express");
const axios = require("axios");
const app = express();
const port = 3030;

// Google OAuth configuration

// Initialize a simple in-memory store for user sessions (you should use a proper session store)
const sessions = {};

app.use(express.json());

// Redirect the user to Google for OAuth
app.get("/auth/google", (req, res) => {
	const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${googleClientId}&redirect_uri=${redirectUri}&scope=openid%20profile%20email&response_type=code`;
	res.redirect(googleAuthUrl);
});

// Handle the Google OAuth callback
app.get("/auth/google/callback", async (req, res) => {
	const { code } = req.query;

	// Exchange the authorization code for an access token and user info
	if (code) {
		try {
			const tokenResponse = await axios.post(
				"https://accounts.google.com/o/oauth2/token",
				null,
				{
					params: {
						code,
						client_id: googleClientId,
						client_secret: googleClientSecret,
						redirect_uri: redirectUri,
						grant_type: "authorization_code",
					},
				}
			);

			// Access token received from Google
			const accessToken = tokenResponse.data.access_token;

			// Use the access token to fetch user information
			const userInfoResponse = await axios.get(
				"https://www.googleapis.com/oauth2/v2/userinfo",
				{
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				}
			);

			const userInfo = userInfoResponse.data;

			console.log("=========>", userInfo);

			// Store the user session (you should implement proper session management)
			const sessionId = generateRandomSessionId();
			sessions[sessionId] = { userInfo, accessToken };

			return res.json(userInfo);

			res.redirect(`/success?sessionId=${sessionId}`);
		} catch (error) {
			console.error("Google OAuth error:", error);
			res.redirect("/error");
		}
	} else {
		res.redirect("/error");
	}
});

app.get("/auth/facebook", (req, res) => {
	const stringifiedParams = objectToQueryString({
		client_id: facebookAppId,
		redirect_uri: redirectUriFaceBook,
		scope: "email", // comma seperated string
		response_type: "code",
	});
	const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?${stringifiedParams}`;
	console.log(facebookAuthUrl);
	res.redirect(facebookAuthUrl);
});

function objectToQueryString(obj) {
	const keyValuePairs = [];
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			const value = obj[key];
			if (value !== undefined) {
				keyValuePairs.push(key + "=" + value);
			}
		}
	}
	return keyValuePairs.join("&");
}

app.get("/auth/facebook/callback", async (req, res) => {
	console.log("testttt");
	const { code } = req.query;
	console.log(code, " is code");

	if (code) {
		try {
			// Exchange the code for an access token
			const tokenResponse = await axios.get(
				"https://graph.facebook.com/v13.0/oauth/access_token",
				{
					params: {
						client_id: facebookAppId,
						client_secret: facebookAppSecret,
						redirect_uri: redirectUriFaceBook,
						code: code,
					},
				}
			);

			const accessToken = tokenResponse.data.access_token;

			// Use the access token to fetch user information
			const userInfoResponse = await axios.get(
				"https://graph.facebook.com/v13.0/me",
				{
					params: {
						fields: "id,email,name",
						access_token: accessToken,
					},
				}
			);

			console.log(
				"facebook =========> ",
				userInfoResponse.data,
				userInfoResponse?.headers,
				userInfoResponse?.url
			);

			const userInfo = userInfoResponse.data;

			// Store the user session (you should implement proper session management)
			return res.json(userInfo);
			res.redirect("/success");
		} catch (error) {
			console.error("Facebook OAuth error:", error);
			res.redirect("/error");
		}
	} else {
		res.redirect("/error");
	}
});

app.get("/auth/github", (req, res) => {
	const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${githubAppId}&redirect_uri=${redirectUrigithub}`;
	res.redirect(githubAuthUrl);
});

app.get("/auth/github/callback", async (req, res) => {
	const code = req.query.code;

	if (code) {
		try {
			// Exchange the code for an access token
			const tokenResponse = await axios.post(
				"https://github.com/login/oauth/access_token",
				null,
				{
					params: {
						code,
						client_id: githubAppId,
						client_secret: githubAppSecret,
					},
				}
			);

			const accessToken = tokenResponse.data.split("=")[1].split("&")[0];

			// Use the access token to fetch user information
			const userResponse = await axios.get(
				"https://api.github.com/user",
				{
					headers: {
						Authorization: `token ${accessToken}`,
					},
				}
			);

			const user = userResponse.data;
			res.json(user);

			// // Create a JWT token and send it to the frontend
			// const token = jwt.sign(
			// 	{ userId: user.id, username: user.login },
			// 	"your-secret-key"
			// );
			// res.redirect(`http://your-frontend-url?token=${token}`);
		} catch (error) {
			console.error("GitHub OAuth error:", error);
			res.redirect("/error");
		}
	} else {
		res.redirect("/error");
	}
});

app.get("/error", (req, res) => {
	res.status(400).json({ message: "Authentication error" });
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

function generateRandomSessionId() {
	// Implement a proper session ID generation method
	return Math.random().toString(36).substring(2, 15);
}
