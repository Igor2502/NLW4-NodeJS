import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { resolve } from 'path';
import { SurveysRepository } from "../repositories/Surveysrepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import SendMailService from "../services/SendMailService";
import { AppError } from "../errors/AppError";

class SendMailController {

    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;

        const userRepository = getCustomRepository(UsersRepository);
        const surveysRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

        const userAlreadyExists = await userRepository.findOne({email});
        if (!userAlreadyExists) {
            throw new AppError("User does not exists!");
        }

        const surveyAlreadyExists = await surveysRepository.findOne({id: survey_id});
        if (!surveyAlreadyExists) {
            throw new AppError("Survey does not exists!");
        }

        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: {user_id: userAlreadyExists.id, value: null},
            relations: ["user", "survey"]
        });
        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");
        const variables = {
            name: userAlreadyExists.name,
            title: surveyAlreadyExists.title,
            description: surveyAlreadyExists.description,
            id: "",
            link: process.env.URL_MAIL
        }

        if (surveyUserAlreadyExists) {
            variables.id = surveyUserAlreadyExists.id;
            await SendMailService.execute(email, surveyAlreadyExists.title, variables, npsPath);
            return response.json(surveyUserAlreadyExists);
        }

        //Salvar as informações na tabela surveyUser
        const surveyUser = surveysUsersRepository.create({ user_id: userAlreadyExists.id, survey_id })
        await surveysUsersRepository.save(surveyUser);

        variables.id = surveyUser.id;
        //Enviar e-mail para o usuário
        await SendMailService.execute(email, surveyAlreadyExists.title, variables, npsPath);

        return response.json({surveyUser})
    }
}

export { SendMailController };