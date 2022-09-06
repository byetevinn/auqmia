import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";

import api, { ICommonHeaderProperties } from "../services/api";
import { getAnimalsApi, IAnimals } from "../services/getAnimalsApi";
import { IUserData, IUserLogin, loginUsers } from "../services/loginUserApi";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { IUpdateUser, upDateUserApi } from "../services/updateUserApi";
import { getUsers } from "../services/getUser";
/* import { string } from "yup"; */
import { IUserRegister } from "../services/registerUserApi";

export interface IAuthContextProps {
  children: ReactNode;
}

interface IAuthContext {
  loginUser: (data: IUserLogin) => Promise<void>;
  loginRoute: () => void;
  listAnimals: IAnimals[];
  user: IUserData;
  isLogged: boolean;
  loading: boolean;
  loginButton: boolean;
  setLoginButton: Dispatch<SetStateAction<boolean>>;
  donationButton: boolean;
  setDonationButton: Dispatch<SetStateAction<boolean>>;
  backProfile: () => void;
  adopted: boolean;
  setAdopted: Dispatch<SetStateAction<boolean>>;
  deleteAnimal: (id: string) => void;
  modalUpdateUser: boolean;
  setModalUpdateUser: Dispatch<SetStateAction<boolean>>;
  updateUser: (id: IUpdateUser) => Promise<void>;
  registerUser: (data: IUserRegister) => void;
}

export const AuthContext = createContext<IAuthContext>({} as IAuthContext);

const AuthProvider = ({ children }: IAuthContextProps) => {
  const navigate = useNavigate();
  const [listAnimals, setListAnimals] = useState([]);
  const [user, setUser] = useState<IUserData>({} as IUserData);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [loginButton, setLoginButton] = useState<boolean>(true);
  const [donationButton, setDonationButton] = useState<boolean>(true);
  const [adopted, setAdopted] = useState<boolean>(true);
  const [modalUpdateUser, setModalUpdateUser] = useState<boolean>(false);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("@AuqMia:token");
      if (token) {
        try {
          api.defaults.headers = {
            Authorization: `bearer ${token}`,
          } as ICommonHeaderProperties;
          getUsers().then((res) => {
            setUser(res);
          });
          getAnimals();
          setIsLogged(true);
        } catch (err) {
          console.log(err);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  useEffect(() => {
    getAnimals();
  }, []);

  const loginUser = async (data: IUserLogin) => {
    loginUsers(data)
      .then((res) => {
        const { user: userResponse, accessToken } = res;
        api.defaults.headers = {
          Authorization: `bearer ${accessToken}`,
        } as ICommonHeaderProperties;
        setUser(userResponse);
        setIsLogged(true);
        toast.success("Login realizado com sucesso!", {
          autoClose: 900,
          theme: "dark",
        });
        navigate("/profile", { replace: true });
        localStorage.setItem("@AuqMia:token", accessToken);

        localStorage.setItem("@AuqMia:id", `${userResponse.id}`);
      })
      .catch((err) =>
        toast.error("Senha ou email incorreto.", {
          autoClose: 900,
          theme: "dark",
        })
      );
  };

  const backProfile = () => {
    navigate("/");
    localStorage.removeItem("@AuqMia:token");
    localStorage.removeItem("@AuqMia:id");
  };

  const loginRoute = () => {
    navigate("/login");
  };

  const getAnimals = async () => {
    await getAnimalsApi()
      .then((res) => {
        setListAnimals(res);
      })
      .catch((err) => console.log(err));
  };

  const deleteAnimal = async (id: string) => {
    const token = localStorage.getItem("@AuqMia:token");

    await api.delete(`animals/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await getAnimals();
  };

  const updateUser = async (value: IUpdateUser) => {
    await upDateUserApi(value)
      .then((res) => {
        console.log(res);
        setUser(res);
        setModalUpdateUser(false);
        toast.success("Usuário atualizado com sucesso!");
      })
      .catch((err) => {
        toast.error("Erro ao atualizar!");
      });
  };

  const registerUser = (data: IUserRegister) => {
    const { confirm_password, state, district, city, ...restData } = data;
    const userData = {
      address: { state: state.toUpperCase(), city, district },
      ...restData,
    };
    api
      .post("/register", userData)
      .then((res) => {
        toast.success("Usuário cadastrado com sucesso!", {
          autoClose: 900,
          theme: "dark",
        });
        navigate("/login", { replace: true });
      })
      .catch((err) => {
        console.log(err);
        toast.error("Não foi possível fazer o cadastro.", {
          autoClose: 900,
          theme: "dark",
        });
      });
  };

  return (
    <AuthContext.Provider
      value={{
        loginUser,
        loginRoute,
        user,
        isLogged,
        loading,
        loginButton,
        setLoginButton,
        donationButton,
        setDonationButton,
        listAnimals,
        backProfile,
        adopted,
        setAdopted,
        deleteAnimal,
        modalUpdateUser,
        setModalUpdateUser,
        updateUser,
        registerUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
