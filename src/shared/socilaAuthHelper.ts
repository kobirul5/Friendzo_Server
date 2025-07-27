import axios from 'axios';

export const getGoogleUser = async (accessToken: string) => {
  const res = await axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  return res.data;
};

export const getFacebookUser = async (accessToken: string) => {
  const res = await axios.get(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
  );
  return res.data;
};
